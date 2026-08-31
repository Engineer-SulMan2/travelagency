"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordWalletTransaction } from "@/lib/wallet";
import { logActivity } from "@/lib/activity-log";
import { Role } from "@prisma/client";
import type { ProductType } from "@/types/booking-summary";

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN];

export type ApprovalState = { error?: string; success?: boolean };

async function requireAdmin() {
  const session = await auth();
  if (!session) return null;
  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || !ADMIN_ROLES.includes(admin.role)) return null;
  return admin;
}

function revalidateAll() {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/wallet");
  revalidatePath("/agent/wallet");
  revalidatePath("/admin/activity");
}

export async function approveBooking(type: ProductType, id: string): Promise<ApprovalState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized" };

  if (type === "FLIGHT") {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.agencyId !== admin.agencyId) return { error: "Booking not found" };
    if (booking.status !== "PENDING") return { error: "Only pending bookings can be approved" };

    const commission = await prisma.commissionEntry.findUnique({ where: { bookingId: booking.id } });

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: { status: "CONFIRMED", approvedById: admin.id, approvedAt: new Date() },
      });

      if (commission && Number(commission.commissionAmount) > 0) {
        await recordWalletTransaction(tx, {
          userId: booking.userId,
          type: "CREDIT",
          reason: "COMMISSION_EARNED",
          amount: Number(commission.commissionAmount),
          referenceType: "FLIGHT",
          referenceId: booking.id,
          description: `Commission for flight booking ${booking.bookingRef}`,
        });
      }

      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "NEW_BOOKING",
          title: "Booking approved",
          message: `${booking.bookingRef} has been approved and is now confirmed.`,
          link: `/invoice/flight/${booking.id}`,
        },
      });

      await logActivity(tx, {
        actorId: admin.id,
        agencyId: admin.agencyId,
        action: "BOOKING_APPROVED",
        description: `${admin.name} approved flight booking ${booking.bookingRef}`,
      });
    });
  } else if (type === "HOTEL") {
    const booking = await prisma.hotelBooking.findUnique({ where: { id } });
    if (!booking || booking.agencyId !== admin.agencyId) return { error: "Booking not found" };
    if (booking.status !== "PENDING") return { error: "Only pending bookings can be approved" };

    const commission = await prisma.commissionEntry.findUnique({ where: { hotelBookingId: booking.id } });

    await prisma.$transaction(async (tx) => {
      await tx.hotelBooking.update({
        where: { id },
        data: { status: "CONFIRMED", approvedById: admin.id, approvedAt: new Date() },
      });

      if (commission && Number(commission.commissionAmount) > 0) {
        await recordWalletTransaction(tx, {
          userId: booking.userId,
          type: "CREDIT",
          reason: "COMMISSION_EARNED",
          amount: Number(commission.commissionAmount),
          referenceType: "HOTEL",
          referenceId: booking.id,
          description: `Commission for hotel booking ${booking.bookingRef}`,
        });
      }

      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "NEW_BOOKING",
          title: "Booking approved",
          message: `${booking.bookingRef} has been approved and is now confirmed.`,
          link: `/invoice/hotel/${booking.id}`,
        },
      });

      await logActivity(tx, {
        actorId: admin.id,
        agencyId: admin.agencyId,
        action: "BOOKING_APPROVED",
        description: `${admin.name} approved hotel booking ${booking.bookingRef}`,
      });
    });
  } else if (type === "PACKAGE") {
    const booking = await prisma.packageBooking.findUnique({ where: { id } });
    if (!booking || booking.agencyId !== admin.agencyId) return { error: "Booking not found" };
    if (booking.status !== "PENDING") return { error: "Only pending bookings can be approved" };

    const commission = await prisma.commissionEntry.findUnique({ where: { packageBookingId: booking.id } });

    await prisma.$transaction(async (tx) => {
      await tx.packageBooking.update({
        where: { id },
        data: { status: "CONFIRMED", approvedById: admin.id, approvedAt: new Date() },
      });

      if (commission && Number(commission.commissionAmount) > 0) {
        await recordWalletTransaction(tx, {
          userId: booking.userId,
          type: "CREDIT",
          reason: "COMMISSION_EARNED",
          amount: Number(commission.commissionAmount),
          referenceType: "PACKAGE",
          referenceId: booking.id,
          description: `Commission for package booking ${booking.bookingRef}`,
        });
      }

      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "NEW_BOOKING",
          title: "Booking approved",
          message: `${booking.bookingRef} has been approved and is now confirmed.`,
          link: `/invoice/package/${booking.id}`,
        },
      });

      await logActivity(tx, {
        actorId: admin.id,
        agencyId: admin.agencyId,
        action: "BOOKING_APPROVED",
        description: `${admin.name} approved package booking ${booking.bookingRef}`,
      });
    });
  } else {
    const booking = await prisma.visaBooking.findUnique({ where: { id } });
    if (!booking || booking.agencyId !== admin.agencyId) return { error: "Booking not found" };
    if (booking.status !== "PENDING") return { error: "Only pending bookings can be approved" };

    const commission = await prisma.commissionEntry.findUnique({ where: { visaBookingId: booking.id } });

    await prisma.$transaction(async (tx) => {
      await tx.visaBooking.update({
        where: { id },
        data: { status: "CONFIRMED", approvedById: admin.id, approvedAt: new Date() },
      });

      if (commission && Number(commission.commissionAmount) > 0) {
        await recordWalletTransaction(tx, {
          userId: booking.userId,
          type: "CREDIT",
          reason: "COMMISSION_EARNED",
          amount: Number(commission.commissionAmount),
          referenceType: "VISA",
          referenceId: booking.id,
          description: `Commission for visa booking ${booking.bookingRef}`,
        });
      }

      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "NEW_BOOKING",
          title: "Booking approved",
          message: `${booking.bookingRef} has been approved and is now confirmed.`,
          link: `/invoice/visa/${booking.id}`,
        },
      });

      await logActivity(tx, {
        actorId: admin.id,
        agencyId: admin.agencyId,
        action: "BOOKING_APPROVED",
        description: `${admin.name} approved visa booking ${booking.bookingRef}`,
      });
    });
  }

  revalidateAll();
  return { success: true };
}

export async function rejectBooking(type: ProductType, id: string): Promise<ApprovalState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized" };

  // No commission clawback needed here — pending bookings never had their
  // commission credited (see the create-*-booking actions).

  if (type === "FLIGHT") {
    const booking = await prisma.booking.findUnique({ where: { id }, include: { passengers: true } });
    if (!booking || booking.agencyId !== admin.agencyId) return { error: "Booking not found" };
    if (booking.status !== "PENDING") return { error: "Only pending bookings can be rejected" };

    const netCost = Number(booking.netFare) * booking.passengers.length;

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id }, data: { status: "CANCELLED" } });
      await recordWalletTransaction(tx, {
        userId: booking.userId,
        type: "CREDIT",
        reason: "REFUND",
        amount: netCost,
        referenceType: "FLIGHT",
        referenceId: booking.id,
        description: `Refund — flight booking ${booking.bookingRef} rejected`,
      });
      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_CANCELLED",
          title: "Booking rejected",
          message: `${booking.bookingRef} was not approved and has been cancelled. Net cost refunded.`,
          link: `/invoice/flight/${booking.id}`,
        },
      });
      await logActivity(tx, {
        actorId: admin.id,
        agencyId: admin.agencyId,
        action: "BOOKING_REJECTED",
        description: `${admin.name} rejected flight booking ${booking.bookingRef}`,
      });
    });
  } else if (type === "HOTEL") {
    const booking = await prisma.hotelBooking.findUnique({ where: { id } });
    if (!booking || booking.agencyId !== admin.agencyId) return { error: "Booking not found" };
    if (booking.status !== "PENDING") return { error: "Only pending bookings can be rejected" };

    const netCost = Number(booking.netFare) * booking.nights * booking.rooms;

    await prisma.$transaction(async (tx) => {
      await tx.hotelBooking.update({ where: { id }, data: { status: "CANCELLED" } });
      await recordWalletTransaction(tx, {
        userId: booking.userId,
        type: "CREDIT",
        reason: "REFUND",
        amount: netCost,
        referenceType: "HOTEL",
        referenceId: booking.id,
        description: `Refund — hotel booking ${booking.bookingRef} rejected`,
      });
      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_CANCELLED",
          title: "Booking rejected",
          message: `${booking.bookingRef} was not approved and has been cancelled. Net cost refunded.`,
          link: `/invoice/hotel/${booking.id}`,
        },
      });
      await logActivity(tx, {
        actorId: admin.id,
        agencyId: admin.agencyId,
        action: "BOOKING_REJECTED",
        description: `${admin.name} rejected hotel booking ${booking.bookingRef}`,
      });
    });
  } else if (type === "PACKAGE") {
    const booking = await prisma.packageBooking.findUnique({ where: { id } });
    if (!booking || booking.agencyId !== admin.agencyId) return { error: "Booking not found" };
    if (booking.status !== "PENDING") return { error: "Only pending bookings can be rejected" };

    const netCost = Number(booking.netFare) * booking.travelers;

    await prisma.$transaction(async (tx) => {
      await tx.packageBooking.update({ where: { id }, data: { status: "CANCELLED" } });
      await recordWalletTransaction(tx, {
        userId: booking.userId,
        type: "CREDIT",
        reason: "REFUND",
        amount: netCost,
        referenceType: "PACKAGE",
        referenceId: booking.id,
        description: `Refund — package booking ${booking.bookingRef} rejected`,
      });
      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_CANCELLED",
          title: "Booking rejected",
          message: `${booking.bookingRef} was not approved and has been cancelled. Net cost refunded.`,
          link: `/invoice/package/${booking.id}`,
        },
      });
      await logActivity(tx, {
        actorId: admin.id,
        agencyId: admin.agencyId,
        action: "BOOKING_REJECTED",
        description: `${admin.name} rejected package booking ${booking.bookingRef}`,
      });
    });
  } else {
    const booking = await prisma.visaBooking.findUnique({ where: { id } });
    if (!booking || booking.agencyId !== admin.agencyId) return { error: "Booking not found" };
    if (booking.status !== "PENDING") return { error: "Only pending bookings can be rejected" };

    const netCost = Number(booking.netFare) * booking.applicants;

    await prisma.$transaction(async (tx) => {
      await tx.visaBooking.update({ where: { id }, data: { status: "CANCELLED" } });
      await recordWalletTransaction(tx, {
        userId: booking.userId,
        type: "CREDIT",
        reason: "REFUND",
        amount: netCost,
        referenceType: "VISA",
        referenceId: booking.id,
        description: `Refund — visa booking ${booking.bookingRef} rejected`,
      });
      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_CANCELLED",
          title: "Booking rejected",
          message: `${booking.bookingRef} was not approved and has been cancelled. Net cost refunded.`,
          link: `/invoice/visa/${booking.id}`,
        },
      });
      await logActivity(tx, {
        actorId: admin.id,
        agencyId: admin.agencyId,
        action: "BOOKING_REJECTED",
        description: `${admin.name} rejected visa booking ${booking.bookingRef}`,
      });
    });
  }

  revalidateAll();
  return { success: true };
}