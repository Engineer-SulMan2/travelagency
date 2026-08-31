"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordWalletTransaction } from "@/lib/wallet";
import { computeBookingPricing } from "@/lib/pricing";
import { getEffectiveCommissionPct } from "@/lib/commission-tiers";
import type { HotelResult } from "@/types/hotel";
import type { GuestDraft } from "@/stores/hotel-booking-store";

const guestSchema = z.object({
  title: z.enum(["Mr", "Mrs", "Ms"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

function generateBookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "HTL-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export async function createHotelBooking(
  hotel: HotelResult,
  checkIn: string,
  checkOut: string,
  nights: number,
  rooms: number,
  guests: GuestDraft[]
) {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");

  const parsedGuests = z.array(guestSchema).min(1).parse(guests);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");
  if (user.walletLocked) throw new Error("Your wallet is locked. Contact your agency admin to unlock it.");

  const agency = user.agencyId ? await prisma.agency.findUnique({ where: { id: user.agencyId } }) : null;

  const markupPct = Number(user.defaultMarkupPct);
  const commissionPct = await getEffectiveCommissionPct(user);
  const quantity = nights * rooms;
  const pricing = computeBookingPricing(hotel.netFarePerNight, markupPct, commissionPct, quantity);

  if (Number(user.walletBalance) < pricing.netCost) {
    throw new Error(
      `Insufficient wallet balance. This booking needs PKR ${pricing.netCost.toLocaleString("en-PK")} net cost, but your wallet has PKR ${Number(user.walletBalance).toLocaleString("en-PK")}. Please top up your wallet.`
    );
  }

  const needsApproval =
    !!agency && Number(agency.approvalThreshold) > 0 && pricing.totalAmount >= Number(agency.approvalThreshold);

  const agencyAdmins = needsApproval
    ? await prisma.user.findMany({
        where: { agencyId: user.agencyId, role: { in: ["SUPER_ADMIN", "AGENCY_ADMIN"] } },
        select: { id: true },
      })
    : [];

  let bookingRef = generateBookingRef();
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.hotelBooking.findUnique({ where: { bookingRef } });
    if (!existing) break;
    bookingRef = generateBookingRef();
  }

  const booking = await prisma.$transaction(async (tx) => {
    let invoiceNumber: number | null = null;
    if (user.agencyId) {
      const updatedAgency = await tx.agency.update({
        where: { id: user.agencyId },
        data: { invoiceCounter: { increment: 1 } },
        select: { invoiceCounter: true },
      });
      invoiceNumber = updatedAgency.invoiceCounter;
    }

    const created = await tx.hotelBooking.create({
      data: {
        bookingRef,
        status: needsApproval ? "PENDING" : "CONFIRMED",
        invoiceNumber,
        userId: user.id,
        agencyId: user.agencyId,
        hotelName: hotel.name,
        city: hotel.city,
        roomType: hotel.roomType,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        nights,
        rooms,
        netFare: hotel.netFarePerNight,
        markupPct,
        markupAmount: pricing.markupAmount,
        sellingFare: pricing.sellingFare,
        totalAmount: pricing.totalAmount,
        guests: {
          create: parsedGuests.map((g) => ({
            title: g.title,
            firstName: g.firstName,
            lastName: g.lastName,
          })),
        },
      },
    });

    await tx.commissionEntry.create({
      data: {
        productType: "HOTEL",
        hotelBookingId: created.id,
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
      referenceType: "HOTEL",
      referenceId: created.id,
      description: `Net cost for hotel booking ${created.bookingRef}`,
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: "NEW_BOOKING",
        title: needsApproval ? "Booking pending approval" : "Hotel booking confirmed",
        message: needsApproval
          ? `${created.bookingRef} — ${hotel.name} needs admin approval before it's confirmed.`
          : `${created.bookingRef} — ${hotel.name}, ${nights} night${nights > 1 ? "s" : ""}`,
        link: `/invoice/hotel/${created.id}`,
      },
    });

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
        referenceType: "HOTEL",
        referenceId: created.id,
        description: `Commission for hotel booking ${created.bookingRef}`,
      });
    }

    return created;
  });

  return { bookingRef: booking.bookingRef, id: booking.id };
}