"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordWalletTransaction } from "@/lib/wallet";
import { computeBookingPricing } from "@/lib/pricing";
import { getEffectiveCommissionPct } from "@/lib/commission-tiers";
import { getVisaNetFee, VISA_COUNTRIES, VISA_TYPES, type VisaType } from "@/lib/visa-fees";

const bookSchema = z.object({
  destinationCountry: z.enum(VISA_COUNTRIES),
  visaType: z.enum(VISA_TYPES.map((t) => t.value) as [VisaType, ...VisaType[]]),
  applicants: z.coerce.number().int().min(1).max(20),
  travelDate: z.string().min(1),
  leadApplicantName: z.string().min(2),
  passportNumber: z.string().min(3),
});

function generateBookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "VSA-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export type VisaBookingState = { error?: string; success?: boolean; bookingRef?: string };

export async function createVisaBooking(
  _prevState: VisaBookingState,
  formData: FormData
): Promise<VisaBookingState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const parsed = bookSchema.safeParse({
    destinationCountry: formData.get("destinationCountry"),
    visaType: formData.get("visaType"),
    applicants: formData.get("applicants"),
    travelDate: formData.get("travelDate"),
    leadApplicantName: formData.get("leadApplicantName"),
    passportNumber: formData.get("passportNumber"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { destinationCountry, visaType, applicants, travelDate, leadApplicantName, passportNumber } =
    parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };
  if (user.walletLocked) return { error: "Your wallet is locked. Contact your agency admin to unlock it." };

  const agency = user.agencyId ? await prisma.agency.findUnique({ where: { id: user.agencyId } }) : null;

  const netFare = getVisaNetFee(destinationCountry, visaType);
  const markupPct = Number(user.defaultMarkupPct);
  const commissionPct = await getEffectiveCommissionPct(user);
  const pricing = computeBookingPricing(netFare, markupPct, commissionPct, applicants);

  if (Number(user.walletBalance) < pricing.netCost) {
    return {
      error: `Insufficient wallet balance. This booking needs PKR ${pricing.netCost.toLocaleString("en-PK")} net cost, but your wallet has PKR ${Number(user.walletBalance).toLocaleString("en-PK")}. Please top up your wallet first.`,
    };
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
    const existing = await prisma.visaBooking.findUnique({ where: { bookingRef } });
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

    const created = await tx.visaBooking.create({
      data: {
        bookingRef,
        status: needsApproval ? "PENDING" : "CONFIRMED",
        invoiceNumber,
        userId: user.id,
        agencyId: user.agencyId,
        destinationCountry,
        visaType,
        applicants,
        travelDate: new Date(travelDate),
        leadApplicantName,
        passportNumber,
        netFare,
        markupPct,
        markupAmount: pricing.markupAmount,
        sellingFare: pricing.sellingFare,
        totalAmount: pricing.totalAmount,
      },
    });

    await tx.commissionEntry.create({
      data: {
        productType: "VISA",
        visaBookingId: created.id,
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
      referenceType: "VISA",
      referenceId: created.id,
      description: `Net cost for visa booking ${created.bookingRef}`,
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: "NEW_BOOKING",
        title: needsApproval ? "Booking pending approval" : "Visa booking confirmed",
        message: needsApproval
          ? `${created.bookingRef} — ${destinationCountry} ${visaType} visa needs admin approval before it's confirmed.`
          : `${created.bookingRef} — ${destinationCountry} ${visaType} visa, ${applicants} applicant${applicants > 1 ? "s" : ""}`,
        link: `/invoice/visa/${created.id}`,
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
        referenceType: "VISA",
        referenceId: created.id,
        description: `Commission for visa booking ${created.bookingRef}`,
      });
    }

    return created;
  });

  return { success: true, bookingRef: booking.bookingRef };
}