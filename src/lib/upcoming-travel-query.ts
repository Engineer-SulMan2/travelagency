import { prisma } from "@/lib/prisma";

type Scope = { agencyId?: string | null } | { userId: string };

export type UpcomingTravelItem = {
  id: string;
  type: "FLIGHT" | "HOTEL" | "PACKAGE" | "VISA";
  bookingRef: string;
  title: string;
  travelerName: string;
  travelDate: string; // ISO
  bookedBy: string;
};

function dateStr(d: Date) {
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

// Bookings whose travel date is today or later, across all four product
// types, sorted soonest-first. Cancelled bookings are excluded — nobody's
// actually travelling on those.
export async function getUpcomingTravel(scope: Scope, daysAhead = 60): Promise<UpcomingTravelItem[]> {
  const where = "userId" in scope ? { userId: scope.userId } : { agencyId: scope.agencyId };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const until = new Date(now);
  until.setDate(until.getDate() + daysAhead);

  const [flights, hotels, packages, visas] = await Promise.all([
    prisma.booking.findMany({
      where: { ...where, status: { not: "CANCELLED" }, departureAt: { gte: now, lte: until } },
      include: { user: { select: { name: true } }, passengers: { select: { firstName: true, lastName: true } } },
      orderBy: { departureAt: "asc" },
    }),
    prisma.hotelBooking.findMany({
      where: { ...where, status: { not: "CANCELLED" }, checkIn: { gte: now, lte: until } },
      include: { user: { select: { name: true } }, guests: { select: { firstName: true, lastName: true } } },
      orderBy: { checkIn: "asc" },
    }),
    prisma.packageBooking.findMany({
      where: { ...where, status: { not: "CANCELLED" }, travelDate: { gte: now, lte: until } },
      include: { user: { select: { name: true } }, package: { select: { title: true } } },
      orderBy: { travelDate: "asc" },
    }),
    prisma.visaBooking.findMany({
      where: { ...where, status: { not: "CANCELLED" }, travelDate: { gte: now, lte: until } },
      include: { user: { select: { name: true } } },
      orderBy: { travelDate: "asc" },
    }),
  ]);

  const items: UpcomingTravelItem[] = [
    ...flights.map((b) => ({
      id: b.id,
      type: "FLIGHT" as const,
      bookingRef: b.bookingRef,
      title: `${b.airline} ${b.flightNumber} · ${b.origin} → ${b.destination}`,
      travelerName: b.passengers[0] ? `${b.passengers[0].firstName} ${b.passengers[0].lastName}` : "—",
      travelDate: b.departureAt.toISOString(),
      bookedBy: b.user.name,
    })),
    ...hotels.map((b) => ({
      id: b.id,
      type: "HOTEL" as const,
      bookingRef: b.bookingRef,
      title: `${b.hotelName} · ${b.city}`,
      travelerName: b.guests[0] ? `${b.guests[0].firstName} ${b.guests[0].lastName}` : "—",
      travelDate: b.checkIn.toISOString(),
      bookedBy: b.user.name,
    })),
    ...packages.map((b) => ({
      id: b.id,
      type: "PACKAGE" as const,
      bookingRef: b.bookingRef,
      title: b.package.title,
      travelerName: b.leadTravelerName,
      travelDate: b.travelDate.toISOString(),
      bookedBy: b.user.name,
    })),
    ...visas.map((b) => ({
      id: b.id,
      type: "VISA" as const,
      bookingRef: b.bookingRef,
      title: `${b.destinationCountry} — ${b.visaType} visa`,
      travelerName: b.leadApplicantName,
      travelDate: b.travelDate.toISOString(),
      bookedBy: b.user.name,
    })),
  ];

  return items.sort((a, b) => new Date(a.travelDate).getTime() - new Date(b.travelDate).getTime());
}

export { dateStr as formatTravelDate };