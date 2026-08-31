import { prisma } from "@/lib/prisma";

type Scope = { agencyId?: string | null } | { userId: string };

// There's no direct FK from a booking's traveler back to a saved Customer
// record (bookings just copy the name in at booking time), so "repeat" is
// a best-effort match on traveler name, normalized and case-insensitive,
// across all four product types in scope.
export async function getRepeatCustomerNames(scope: Scope): Promise<Set<string>> {
  const where = "userId" in scope ? { userId: scope.userId } : { agencyId: scope.agencyId };

  const [flights, hotels, packages, visas] = await Promise.all([
    prisma.booking.findMany({
      where,
      select: { passengers: { select: { firstName: true, lastName: true } } },
    }),
    prisma.hotelBooking.findMany({
      where,
      select: { guests: { select: { firstName: true, lastName: true } } },
    }),
    prisma.packageBooking.findMany({ where, select: { leadTravelerName: true } }),
    prisma.visaBooking.findMany({ where, select: { leadApplicantName: true } }),
  ]);

  const counts = new Map<string, number>();
  function bump(name: string) {
    const key = name.trim().toLowerCase();
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  flights.forEach((b) => b.passengers.forEach((p) => bump(`${p.firstName} ${p.lastName}`)));
  hotels.forEach((b) => b.guests.forEach((g) => bump(`${g.firstName} ${g.lastName}`)));
  packages.forEach((b) => bump(b.leadTravelerName));
  visas.forEach((b) => bump(b.leadApplicantName));

  const repeatNames = new Set<string>();
  for (const [name, count] of counts) {
    if (count >= 2) repeatNames.add(name);
  }
  return repeatNames;
}