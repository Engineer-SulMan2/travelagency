"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordWalletTransaction } from "@/lib/wallet";
import { computeBookingPricing } from "@/lib/pricing";

const bookSchema = z.object({
  packageId: z.string().min(1),
  travelDate: z.string().min(1),
  travelers: z.coerce.number().int().min(1).max(20),
  leadTravelerName: z.string().min(2),
});

function generateBookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "PKG-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export type PackageBookingState = { error?: string; success?: boolean; bookingRef?: string };

export async function createPackageBooking(
  _prevState: PackageBookingState,
  formData: FormData
): Promise<PackageBookingState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const parsed = bookSchema.safeParse({
    packageId: formData.get("packageId"),
    travelDate: formData.get("travelDate"),
    travelers: formData.get("travelers"),
    leadTravelerName: formData.get("leadTravelerName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { packageId, travelDate, travelers, leadTravelerName } = parsed.data;

  const [user, pkg] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.package.findUnique({ where: { id: packageId } }),
  ]);

  if (!user) return { error: "User not found" };
  if (!pkg || !pkg.isActive) return { error: "Package is no longer available" };

  if (pkg.maxSeats != null) {
    const booked = await prisma.packageBooking.aggregate({
      where: { packageId: pkg.id, status: { not: "CANCELLED" } },
      _sum: { travelers: true },
    });
    const remaining = pkg.maxSeats - (booked._sum.travelers ?? 0);
    if (travelers > remaining) {
      return {
        error:
          remaining <= 0
            ? "This package is fully booked."
            : `Only ${remaining} seat${remaining === 1 ? "" : "s"} left on this package.`,
      };
    }
  }

  const agency = user.agencyId ? await prisma.agency.findUnique({ where: { id: user.agencyId } }) : null;

  const markupPct = Number(user.defaultMarkupPct);
  const commissionPct = Number(user.commissionPct);
  const pricing = computeBookingPricing(Number(pkg.basePrice), markupPct, commissionPct, travelers);

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
    const existing = await prisma.packageBooking.findUnique({ where: { bookingRef } });
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

    const created = await tx.packageBooking.create({
      data: {
        bookingRef,
        status: needsApproval ? "PENDING" : "CONFIRMED",
        invoiceNumber,
        userId: user.id,
        agencyId: user.agencyId,
        packageId: pkg.id,
        travelDate: new Date(travelDate),
        travelers,
        leadTravelerName,
        netFare: pkg.basePrice,
        markupPct,
        markupAmount: pricing.markupAmount,
        sellingFare: pricing.sellingFare,
        totalAmount: pricing.totalAmount,
      },
    });

    await tx.commissionEntry.create({
      data: {
        productType: "PACKAGE",
        packageBookingId: created.id,
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
      referenceType: "PACKAGE",
      referenceId: created.id,
      description: `Net cost for package booking ${created.bookingRef}`,
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: "NEW_BOOKING",
        title: needsApproval ? "Booking pending approval" : "Package booking confirmed",
        message: needsApproval
          ? `${created.bookingRef} — ${pkg.title} needs admin approval before it's confirmed.`
          : `${created.bookingRef} — ${pkg.title}, ${travelers} traveler${travelers > 1 ? "s" : ""}`,
        link: `/invoice/package/${created.id}`,
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
        referenceType: "PACKAGE",
        referenceId: created.id,
        description: `Commission for package booking ${created.bookingRef}`,
      });
    }

    return created;
  });

  return { success: true, bookingRef: booking.bookingRef };
}