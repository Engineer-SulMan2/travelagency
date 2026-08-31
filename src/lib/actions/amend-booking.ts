"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordWalletTransaction } from "@/lib/wallet";
import { logActivity } from "@/lib/activity-log";
import { Role } from "@prisma/client";

export type AmendState = { error?: string; success?: boolean };

import { AMENDMENT_FEE } from "@/lib/amendment-fee";

async function authorizeAndGetUser(bookingUserId: string, bookingAgencyId: string | null) {
  const session = await auth();
  if (!session) return null;
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser) return null;
  const isAdmin = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(currentUser.role);
  const authorized = currentUser.id === bookingUserId || (isAdmin && currentUser.agencyId === bookingAgencyId);
  return authorized ? currentUser : null;
}

function revalidateAll() {
  revalidatePath("/admin/bookings");
  revalidatePath("/agent/bookings");
  revalidatePath("/admin/wallet");
  revalidatePath("/agent/wallet");
  revalidatePath("/admin/activity");
}

export async function amendFlightBooking(id: string, newDepartureDate: string): Promise<AmendState> {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return { error: "Booking not found" };
  const currentUser = await authorizeAndGetUser(booking.userId, booking.agencyId);
  if (!currentUser) return { error: "Not authorized" };
  if (booking.status !== "CONFIRMED") return { error: "Only confirmed bookings can be amended" };

  const owner = await prisma.user.findUnique({ where: { id: booking.userId } });
  if (!owner) return { error: "Booking owner not found" };
  if (Number(owner.walletBalance) - AMENDMENT_FEE < -Number(owner.creditLimit)) {
    return { error: "Insufficient wallet balance for the amendment fee" };
  }

  // Keep the same flight duration, just shift both legs to the new date
  const durationMs = booking.arrivalAt.getTime() - booking.departureAt.getTime();
  const oldDeparture = booking.departureAt;
  const newDeparture = new Date(newDepartureDate);
  newDeparture.setHours(oldDeparture.getHours(), oldDeparture.getMinutes(), 0, 0);
  const newArrival = new Date(newDeparture.getTime() + durationMs);

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id },
      data: { departureAt: newDeparture, arrivalAt: newArrival, amendedAt: new Date() },
    });

    await recordWalletTransaction(tx, {
      userId: booking.userId,
      type: "DEBIT",
      reason: "ADJUSTMENT",
      amount: AMENDMENT_FEE,
      referenceType: "FLIGHT",
      referenceId: booking.id,
      description: `Amendment fee — flight booking ${booking.bookingRef} date changed`,
    });

    await tx.notification.create({
      data: {
        userId: booking.userId,
        type: "SYSTEM",
        title: "Booking amended",
        message: `${booking.bookingRef} — new departure date set. PKR ${AMENDMENT_FEE.toLocaleString("en-PK")} amendment fee applied.`,
        link: `/invoice/flight/${booking.id}`,
      },
    });

    await logActivity(tx, {
      actorId: currentUser.id,
      agencyId: currentUser.agencyId,
      action: "BOOKING_AMENDED",
      description: `${currentUser.name} amended flight booking ${booking.bookingRef} — new date set`,
    });
  });

  revalidateAll();
  return { success: true };
}

export async function amendHotelBooking(id: string, newCheckIn: string, newCheckOut: string): Promise<AmendState> {
  const booking = await prisma.hotelBooking.findUnique({ where: { id } });
  if (!booking) return { error: "Booking not found" };
  const currentUser = await authorizeAndGetUser(booking.userId, booking.agencyId);
  if (!currentUser) return { error: "Not authorized" };
  if (booking.status !== "CONFIRMED") return { error: "Only confirmed bookings can be amended" };

  const checkInDate = new Date(newCheckIn);
  const checkOutDate = new Date(newCheckOut);
  const newNights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  if (newNights !== booking.nights) {
    return { error: `New dates must span the same ${booking.nights} night(s) as the original booking` };
  }

  const owner = await prisma.user.findUnique({ where: { id: booking.userId } });
  if (!owner) return { error: "Booking owner not found" };
  if (Number(owner.walletBalance) - AMENDMENT_FEE < -Number(owner.creditLimit)) {
    return { error: "Insufficient wallet balance for the amendment fee" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.hotelBooking.update({
      where: { id },
      data: { checkIn: checkInDate, checkOut: checkOutDate, amendedAt: new Date() },
    });

    await recordWalletTransaction(tx, {
      userId: booking.userId,
      type: "DEBIT",
      reason: "ADJUSTMENT",
      amount: AMENDMENT_FEE,
      referenceType: "HOTEL",
      referenceId: booking.id,
      description: `Amendment fee — hotel booking ${booking.bookingRef} dates changed`,
    });

    await tx.notification.create({
      data: {
        userId: booking.userId,
        type: "SYSTEM",
        title: "Booking amended",
        message: `${booking.bookingRef} — new dates set. PKR ${AMENDMENT_FEE.toLocaleString("en-PK")} amendment fee applied.`,
        link: `/invoice/hotel/${booking.id}`,
      },
    });

    await logActivity(tx, {
      actorId: currentUser.id,
      agencyId: currentUser.agencyId,
      action: "BOOKING_AMENDED",
      description: `${currentUser.name} amended hotel booking ${booking.bookingRef} — new dates set`,
    });
  });

  revalidateAll();
  return { success: true };
}

export async function amendPackageBooking(id: string, newTravelDate: string): Promise<AmendState> {
  const booking = await prisma.packageBooking.findUnique({ where: { id } });
  if (!booking) return { error: "Booking not found" };
  const currentUser = await authorizeAndGetUser(booking.userId, booking.agencyId);
  if (!currentUser) return { error: "Not authorized" };
  if (booking.status !== "CONFIRMED") return { error: "Only confirmed bookings can be amended" };

  const owner = await prisma.user.findUnique({ where: { id: booking.userId } });
  if (!owner) return { error: "Booking owner not found" };
  if (Number(owner.walletBalance) - AMENDMENT_FEE < -Number(owner.creditLimit)) {
    return { error: "Insufficient wallet balance for the amendment fee" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.packageBooking.update({
      where: { id },
      data: { travelDate: new Date(newTravelDate), amendedAt: new Date() },
    });

    await recordWalletTransaction(tx, {
      userId: booking.userId,
      type: "DEBIT",
      reason: "ADJUSTMENT",
      amount: AMENDMENT_FEE,
      referenceType: "PACKAGE",
      referenceId: booking.id,
      description: `Amendment fee — package booking ${booking.bookingRef} travel date changed`,
    });

    await tx.notification.create({
      data: {
        userId: booking.userId,
        type: "SYSTEM",
        title: "Booking amended",
        message: `${booking.bookingRef} — new travel date set. PKR ${AMENDMENT_FEE.toLocaleString("en-PK")} amendment fee applied.`,
        link: `/invoice/package/${booking.id}`,
      },
    });

    await logActivity(tx, {
      actorId: currentUser.id,
      agencyId: currentUser.agencyId,
      action: "BOOKING_AMENDED",
      description: `${currentUser.name} amended package booking ${booking.bookingRef} — new travel date set`,
    });
  });

  revalidateAll();
  return { success: true };
}

export async function amendVisaBooking(id: string, newTravelDate: string): Promise<AmendState> {
  const booking = await prisma.visaBooking.findUnique({ where: { id } });
  if (!booking) return { error: "Booking not found" };
  const currentUser = await authorizeAndGetUser(booking.userId, booking.agencyId);
  if (!currentUser) return { error: "Not authorized" };
  if (booking.status !== "CONFIRMED") return { error: "Only confirmed bookings can be amended" };

  const owner = await prisma.user.findUnique({ where: { id: booking.userId } });
  if (!owner) return { error: "Booking owner not found" };
  if (Number(owner.walletBalance) - AMENDMENT_FEE < -Number(owner.creditLimit)) {
    return { error: "Insufficient wallet balance for the amendment fee" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.visaBooking.update({
      where: { id },
      data: { travelDate: new Date(newTravelDate), amendedAt: new Date() },
    });

    await recordWalletTransaction(tx, {
      userId: booking.userId,
      type: "DEBIT",
      reason: "ADJUSTMENT",
      amount: AMENDMENT_FEE,
      referenceType: "VISA",
      referenceId: booking.id,
      description: `Amendment fee — visa booking ${booking.bookingRef} travel date changed`,
    });

    await tx.notification.create({
      data: {
        userId: booking.userId,
        type: "SYSTEM",
        title: "Booking amended",
        message: `${booking.bookingRef} — new travel date set. PKR ${AMENDMENT_FEE.toLocaleString("en-PK")} amendment fee applied.`,
        link: `/invoice/visa/${booking.id}`,
      },
    });

    await logActivity(tx, {
      actorId: currentUser.id,
      agencyId: currentUser.agencyId,
      action: "BOOKING_AMENDED",
      description: `${currentUser.name} amended visa booking ${booking.bookingRef} — new travel date set`,
    });
  });

  revalidateAll();
  return { success: true };
}