"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordWalletTransaction } from "@/lib/wallet";
import { logActivity } from "@/lib/activity-log";
import { Role } from "@prisma/client";
import type { ProductType } from "@/types/booking-summary";

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN];

export type CancelState = { error?: string; success?: boolean };

export async function cancelBooking(type: ProductType, id: string): Promise<CancelState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser) return { error: "Not authenticated" };

  const isAdmin = ADMIN_ROLES.includes(currentUser.role);

  function authorize(record: { userId: string; agencyId: string | null } | null) {
    if (!record) return false;
    if (record.userId === currentUser!.id) return true;
    if (isAdmin && record.agencyId === currentUser!.agencyId) return true;
    return false;
  }

  // Refunds the net cost back to the booking owner's wallet, and claws back
  // any commission already paid out on it, then marks the booking cancelled
  // — all in one transaction so the wallet ledger and booking status never
  // disagree.

  if (type === "FLIGHT") {
    const booking = await prisma.booking.findUnique({ where: { id }, include: { passengers: true } });
    if (!authorize(booking)) return { error: "Booking not found" };
    if (!booking || booking.status === "CANCELLED") return { error: "Already cancelled" };

    const netCost = Number(booking.netFare) * booking.passengers.length;
    const commission = await prisma.commissionEntry.findUnique({ where: { bookingId: booking.id } });

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id }, data: { status: "CANCELLED" } });
      await recordWalletTransaction(tx, {
        userId: booking.userId,
        type: "CREDIT",
        reason: "REFUND",
        amount: netCost,
        referenceType: "FLIGHT",
        referenceId: booking.id,
        description: `Refund — flight booking ${booking.bookingRef} cancelled`,
      });
      if (commission && Number(commission.commissionAmount) > 0) {
        await recordWalletTransaction(tx, {
          userId: booking.userId,
          type: "DEBIT",
          reason: "ADJUSTMENT",
          amount: Number(commission.commissionAmount),
          referenceType: "FLIGHT",
          referenceId: booking.id,
          description: `Commission clawback — flight booking ${booking.bookingRef} cancelled`,
        });
      }
      await logActivity(tx, {
        actorId: currentUser.id,
        agencyId: currentUser.agencyId,
        action: "BOOKING_CANCELLED",
        description: `${currentUser.name} cancelled flight booking ${booking.bookingRef}`,
      });
    });
  } else if (type === "HOTEL") {
    const booking = await prisma.hotelBooking.findUnique({ where: { id } });
    if (!authorize(booking)) return { error: "Booking not found" };
    if (!booking || booking.status === "CANCELLED") return { error: "Already cancelled" };

    const netCost = Number(booking.netFare) * booking.nights * booking.rooms;
    const commission = await prisma.commissionEntry.findUnique({ where: { hotelBookingId: booking.id } });

    await prisma.$transaction(async (tx) => {
      await tx.hotelBooking.update({ where: { id }, data: { status: "CANCELLED" } });
      await recordWalletTransaction(tx, {
        userId: booking.userId,
        type: "CREDIT",
        reason: "REFUND",
        amount: netCost,
        referenceType: "HOTEL",
        referenceId: booking.id,
        description: `Refund — hotel booking ${booking.bookingRef} cancelled`,
      });
      if (commission && Number(commission.commissionAmount) > 0) {
        await recordWalletTransaction(tx, {
          userId: booking.userId,
          type: "DEBIT",
          reason: "ADJUSTMENT",
          amount: Number(commission.commissionAmount),
          referenceType: "HOTEL",
          referenceId: booking.id,
          description: `Commission clawback — hotel booking ${booking.bookingRef} cancelled`,
        });
      }
      await logActivity(tx, {
        actorId: currentUser.id,
        agencyId: currentUser.agencyId,
        action: "BOOKING_CANCELLED",
        description: `${currentUser.name} cancelled hotel booking ${booking.bookingRef}`,
      });
    });
  } else if (type === "PACKAGE") {
    const booking = await prisma.packageBooking.findUnique({ where: { id } });
    if (!authorize(booking)) return { error: "Booking not found" };
    if (!booking || booking.status === "CANCELLED") return { error: "Already cancelled" };

    const netCost = Number(booking.netFare) * booking.travelers;
    const commission = await prisma.commissionEntry.findUnique({ where: { packageBookingId: booking.id } });

    await prisma.$transaction(async (tx) => {
      await tx.packageBooking.update({ where: { id }, data: { status: "CANCELLED" } });
      await recordWalletTransaction(tx, {
        userId: booking.userId,
        type: "CREDIT",
        reason: "REFUND",
        amount: netCost,
        referenceType: "PACKAGE",
        referenceId: booking.id,
        description: `Refund — package booking ${booking.bookingRef} cancelled`,
      });
      if (commission && Number(commission.commissionAmount) > 0) {
        await recordWalletTransaction(tx, {
          userId: booking.userId,
          type: "DEBIT",
          reason: "ADJUSTMENT",
          amount: Number(commission.commissionAmount),
          referenceType: "PACKAGE",
          referenceId: booking.id,
          description: `Commission clawback — package booking ${booking.bookingRef} cancelled`,
        });
      }
      await logActivity(tx, {
        actorId: currentUser.id,
        agencyId: currentUser.agencyId,
        action: "BOOKING_CANCELLED",
        description: `${currentUser.name} cancelled package booking ${booking.bookingRef}`,
      });
    });
  } else {
    const booking = await prisma.visaBooking.findUnique({ where: { id } });
    if (!authorize(booking)) return { error: "Booking not found" };
    if (!booking || booking.status === "CANCELLED") return { error: "Already cancelled" };

    const netCost = Number(booking.netFare) * booking.applicants;
    const commission = await prisma.commissionEntry.findUnique({ where: { visaBookingId: booking.id } });

    await prisma.$transaction(async (tx) => {
      await tx.visaBooking.update({ where: { id }, data: { status: "CANCELLED" } });
      await recordWalletTransaction(tx, {
        userId: booking.userId,
        type: "CREDIT",
        reason: "REFUND",
        amount: netCost,
        referenceType: "VISA",
        referenceId: booking.id,
        description: `Refund — visa booking ${booking.bookingRef} cancelled`,
      });
      if (commission && Number(commission.commissionAmount) > 0) {
        await recordWalletTransaction(tx, {
          userId: booking.userId,
          type: "DEBIT",
          reason: "ADJUSTMENT",
          amount: Number(commission.commissionAmount),
          referenceType: "VISA",
          referenceId: booking.id,
          description: `Commission clawback — visa booking ${booking.bookingRef} cancelled`,
        });
      }
      await logActivity(tx, {
        actorId: currentUser.id,
        agencyId: currentUser.agencyId,
        action: "BOOKING_CANCELLED",
        description: `${currentUser.name} cancelled visa booking ${booking.bookingRef}`,
      });
    });
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/agent/bookings");
  revalidatePath("/admin/wallet");
  revalidatePath("/agent/wallet");
  revalidatePath("/admin/activity");
  return { success: true };
}