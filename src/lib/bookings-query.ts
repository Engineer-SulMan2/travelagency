import { prisma } from "@/lib/prisma";
import type { BookingSummary } from "@/types/booking-summary";

type Scope = { agencyId?: string | null } | { userId: string };

function dateStr(d: Date) {
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getUnifiedBookings(scope: Scope): Promise<BookingSummary[]> {
  const where =
    "userId" in scope ? { userId: scope.userId } : { agencyId: scope.agencyId };

  const [flights, hotels, packages, visas] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.hotelBooking.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.packageBooking.findMany({
      where,
      include: { user: { select: { name: true } }, package: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.visaBooking.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const flightRows: BookingSummary[] = flights.map((b) => ({
    id: b.id,
    type: "FLIGHT",
    bookingRef: b.bookingRef,
    status: b.status,
    title: `${b.airline} ${b.flightNumber} · ${b.origin} → ${b.destination}`,
    subtitle: dateStr(b.departureAt),
    bookedBy: b.user.name,
    totalAmount: Number(b.totalAmount),
    createdAt: b.createdAt.toISOString(),
    amendableDate: isoDate(b.departureAt),
  }));

  const hotelRows: BookingSummary[] = hotels.map((b) => ({
    id: b.id,
    type: "HOTEL",
    bookingRef: b.bookingRef,
    status: b.status,
    title: `${b.hotelName} · ${b.roomType}`,
    subtitle: `${dateStr(b.checkIn)} → ${dateStr(b.checkOut)} · ${b.nights}n / ${b.rooms}rm`,
    bookedBy: b.user.name,
    totalAmount: Number(b.totalAmount),
    createdAt: b.createdAt.toISOString(),
    checkIn: isoDate(b.checkIn),
    checkOut: isoDate(b.checkOut),
  }));

  const packageRows: BookingSummary[] = packages.map((b) => ({
    id: b.id,
    type: "PACKAGE",
    bookingRef: b.bookingRef,
    status: b.status,
    title: b.package.title,
    subtitle: `${dateStr(b.travelDate)} · ${b.travelers} traveler${b.travelers > 1 ? "s" : ""}`,
    bookedBy: b.user.name,
    totalAmount: Number(b.totalAmount),
    createdAt: b.createdAt.toISOString(),
    amendableDate: isoDate(b.travelDate),
  }));

  const visaRows: BookingSummary[] = visas.map((b) => ({
    id: b.id,
    type: "VISA",
    bookingRef: b.bookingRef,
    status: b.status,
    title: `${b.destinationCountry} · ${b.visaType} visa`,
    subtitle: `${dateStr(b.travelDate)} · ${b.applicants} applicant${b.applicants > 1 ? "s" : ""}`,
    bookedBy: b.user.name,
    totalAmount: Number(b.totalAmount),
    createdAt: b.createdAt.toISOString(),
    amendableDate: isoDate(b.travelDate),
  }));

  return [...flightRows, ...hotelRows, ...packageRows, ...visaRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}