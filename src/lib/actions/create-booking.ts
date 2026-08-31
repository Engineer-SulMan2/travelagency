"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordWalletTransaction } from "@/lib/wallet";
import { computeBookingPricing } from "@/lib/pricing";
import { getEffectiveCommissionPct } from "@/lib/commission-tiers";
import type { FlightResult } from "@/types/flight";
import type { PassengerDraft } from "@/stores/booking-store";

const passengerSchema = z.object({
  type: z.enum(["ADULT", "CHILD", "INFANT"]),
  title: z.enum(["Mr", "Mrs", "Ms"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  passportNumber: z.string().optional(),
});

function generateBookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "TRV-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export async function createBooking(flight: FlightResult, passengers: PassengerDraft[]) {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");

  const parsedPassengers = z.array(passengerSchema).min(1).parse(passengers);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");
  if (user.walletLocked) throw new Error("Your wallet is locked. Contact your agency admin to unlock it.");

  const agency = user.agencyId ? await prisma.agency.findUnique({ where: { id: user.agencyId } }) : null;

  const markupPct = Number(user.defaultMarkupPct);
  const commissionPct = await getEffectiveCommissionPct(user);
  const pricing = computeBookingPricing(flight.netFare, markupPct, commissionPct, parsedPassengers.length);

  if (Number(user.walletBalance) < pricing.netCost) {
    throw new Error(
      `Insufficient wallet balance. This booking needs PKR ${pricing.netCost.toLocaleString("en-PK")} net cost, but your wallet has PKR ${Number(user.walletBalance).toLocaleString("en-PK")}. Please top up your wallet.`
    );
  }

  // Bookings at or above the agency's approval threshold (if set) start as
  // PENDING and need an admin to approve them before they're confirmed and
  // the sub-agent's commission is credited (see booking-approval.ts).
  const needsApproval =
    !!agency && Number(agency.approvalThreshold) > 0 && pricing.totalAmount >= Number(agency.approvalThreshold);

  const agencyAdmins = needsApproval
    ? await prisma.user.findMany({
        where: { agencyId: user.agencyId, role: { in: ["SUPER_ADMIN", "AGENCY_ADMIN"] } },
        select: { id: true },
      })
    : [];

  const segment = flight.itineraries[0].segments[0];
  const lastSegmentOfFirstLeg = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];
  const tripType = flight.itineraries.length === 1 ? "ONE_WAY" : flight.itineraries.length === 2 ? "ROUND_TRIP" : "MULTI_CITY";

  let bookingRef = generateBookingRef();
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.booking.findUnique({ where: { bookingRef } });
    if (!existing) break;
    bookingRef = generateBookingRef();
  }

  const booking = await prisma.$transaction(async (tx) => {
    // Sequential per-agency invoice number (Phase 12) — atomically
    // incremented so concurrent bookings never collide.
    let invoiceNumber: number | null = null;
    if (user.agencyId) {
      const updatedAgency = await tx.agency.update({
        where: { id: user.agencyId },
        data: { invoiceCounter: { increment: 1 } },
        select: { invoiceCounter: true },
      });
      invoiceNumber = updatedAgency.invoiceCounter;
    }

    const created = await tx.booking.create({
      data: {
        bookingRef,
        status: needsApproval ? "PENDING" : "CONFIRMED",
        invoiceNumber,
        userId: user.id,
        agencyId: user.agencyId,
        airline: segment.airline,
        flightNumber: segment.flightNumber,
        origin: segment.origin,
        destination: lastSegmentOfFirstLeg.destination,
        departureAt: new Date(segment.departureAt),
        arrivalAt: new Date(lastSegmentOfFirstLeg.arrivalAt),
        cabinClass: flight.cabinClass,
        tripType,
        netFare: flight.netFare,
        markupPct,
        markupAmount: pricing.markupAmount,
        sellingFare: pricing.sellingFare,
        totalAmount: pricing.totalAmount,
        passengers: {
          create: parsedPassengers.map((p) => ({
            type: p.type,
            title: p.title,
            firstName: p.firstName,
            lastName: p.lastName,
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
            passportNumber: p.passportNumber || null,
          })),
        },
      },
    });

    if (flight.itineraries.length > 1) {
      await tx.flightLeg.createMany({
        data: flight.itineraries.slice(1).map((itinerary, idx) => {
          const first = itinerary.segments[0];
          const last = itinerary.segments[itinerary.segments.length - 1];
          return {
            bookingId: created.id,
            legOrder: idx + 1,
            airline: first.airline,
            flightNumber: first.flightNumber,
            origin: first.origin,
            destination: last.destination,
            departureAt: new Date(first.departureAt),
            arrivalAt: new Date(last.arrivalAt),
          };
        }),
      });
    }

    await tx.commissionEntry.create({
      data: {
        productType: "FLIGHT",
        bookingId: created.id,
        userId: user.id,
        agencyId: user.agencyId,
        markupAmount: pricing.totalMarkup,
        commissionPct,
        commissionAmount: pricing.commissionAmount,
        agencyShare: pricing.agencyShare,
      },
    });

    await recordWalletTransaction(tx, {
      userId: user.id,
      type: "DEBIT",
      reason: "BOOKING_PAYMENT",
      amount: pricing.netCost,
      referenceType: "FLIGHT",
      referenceId: created.id,
      description: `Net cost for flight booking ${created.bookingRef}`,
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: "NEW_BOOKING",
        title: needsApproval ? "Booking pending approval" : "Flight booking confirmed",
        message: needsApproval
          ? `${created.bookingRef} — ${segment.airline} ${segment.flightNumber} needs admin approval before it's confirmed.`
          : `${created.bookingRef} — ${segment.airline} ${segment.flightNumber}, ${segment.origin} → ${lastSegmentOfFirstLeg.destination}${tripType !== "ONE_WAY" ? ` (${tripType === "ROUND_TRIP" ? "return" : "multi-city"})` : ""}`,
        link: `/invoice/flight/${created.id}`,
      },
    });

    // Commission is only credited once the booking is confirmed — either
    // immediately here (no approval needed) or later via approveBooking().
    if (needsApproval) {
      for (const admin of agencyAdmins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            type: "SYSTEM",
            title: "Booking needs approval",
            message: `${user.name} booked ${created.bookingRef} (PKR ${pricing.totalAmount.toLocaleString("en-PK")}) — approval required.`,
            link: "/admin/approvals",
          },
        });
      }
    }

    if (!needsApproval && pricing.commissionAmount > 0) {
      await recordWalletTransaction(tx, {
        userId: user.id,
        type: "CREDIT",
        reason: "COMMISSION_EARNED",
        amount: pricing.commissionAmount,
        referenceType: "FLIGHT",
        referenceId: created.id,
        description: `Commission for flight booking ${created.bookingRef}`,
      });
    }

    return created;
  });

  return { bookingRef: booking.bookingRef, id: booking.id };
}