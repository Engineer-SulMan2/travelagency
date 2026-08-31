"use server";

import { prisma } from "@/lib/prisma";

export type TrackResult = {
  found: boolean;
  bookingRef?: string;
  type?: string;
  status?: string;
  title?: string;
  subtitle?: string;
  totalAmount?: number;
  agencyName?: string;
  agencyLogoUrl?: string | null;
};

function matchesName(candidates: string[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return candidates.some((c) => c.toLowerCase().includes(q));
}

export async function lookupBookingStatus(bookingRefRaw: string, lastName: string): Promise<TrackResult> {
  const bookingRef = bookingRefRaw.trim().toUpperCase();
  if (!bookingRef || !lastName.trim()) return { found: false };

  const [flight, hotel, pkg, visa] = await Promise.all([
    prisma.booking.findUnique({
      where: { bookingRef },
      include: { passengers: true, user: { include: { agency: true } } },
    }),
    prisma.hotelBooking.findUnique({
      where: { bookingRef },
      include: { guests: true, user: { include: { agency: true } } },
    }),
    prisma.packageBooking.findUnique({
      where: { bookingRef },
      include: { package: true, user: { include: { agency: true } } },
    }),
    prisma.visaBooking.findUnique({
      where: { bookingRef },
      include: { user: { include: { agency: true } } },
    }),
  ]);

  if (flight) {
    const names = flight.passengers.map((p) => p.lastName);
    if (!matchesName(names, lastName)) return { found: false };
    return {
      found: true,
      bookingRef: flight.bookingRef,
      type: "Flight",
      status: flight.status,
      title: `${flight.airline} ${flight.flightNumber} — ${flight.origin} → ${flight.destination}`,
      subtitle: flight.departureAt.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }),
      totalAmount: Number(flight.totalAmount),
      agencyName: flight.user.agency?.name,
      agencyLogoUrl: flight.user.agency?.logoUrl,
    };
  }

  if (hotel) {
    const names = hotel.guests.map((g) => g.lastName);
    if (!matchesName(names, lastName)) return { found: false };
    return {
      found: true,
      bookingRef: hotel.bookingRef,
      type: "Hotel",
      status: hotel.status,
      title: `${hotel.hotelName} — ${hotel.roomType}`,
      subtitle: `${hotel.checkIn.toLocaleDateString("en-PK")} → ${hotel.checkOut.toLocaleDateString("en-PK")}`,
      totalAmount: Number(hotel.totalAmount),
      agencyName: hotel.user.agency?.name,
      agencyLogoUrl: hotel.user.agency?.logoUrl,
    };
  }

  if (pkg) {
    if (!matchesName([pkg.leadTravelerName], lastName)) return { found: false };
    return {
      found: true,
      bookingRef: pkg.bookingRef,
      type: "Package",
      status: pkg.status,
      title: pkg.package.title,
      subtitle: pkg.travelDate.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }),
      totalAmount: Number(pkg.totalAmount),
      agencyName: pkg.user.agency?.name,
      agencyLogoUrl: pkg.user.agency?.logoUrl,
    };
  }

  if (visa) {
    if (!matchesName([visa.leadApplicantName], lastName)) return { found: false };
    return {
      found: true,
      bookingRef: visa.bookingRef,
      type: "Visa",
      status: visa.status,
      title: `${visa.destinationCountry} — ${visa.visaType} visa`,
      subtitle: visa.travelDate.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }),
      totalAmount: Number(visa.totalAmount),
      agencyName: visa.user.agency?.name,
      agencyLogoUrl: visa.user.agency?.logoUrl,
    };
  }

  return { found: false };
}