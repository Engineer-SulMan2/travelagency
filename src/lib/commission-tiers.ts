import { prisma } from "@/lib/prisma";

// A sub-agent's commission % this month is the highest tier whose
// minRevenue they've cleared (revenue = sum of their active bookings'
// totalAmount since the 1st of the current calendar month, in PKR).
// Falls back to their fixed User.commissionPct when tiers are off, none
// are configured, or they haven't reached any threshold yet.
export async function getEffectiveCommissionPct(user: {
  id: string;
  agencyId: string | null;
  commissionPct: unknown; // Prisma Decimal
}): Promise<number> {
  const fallback = Number(user.commissionPct);
  if (!user.agencyId) return fallback;

  const agency = await prisma.agency.findUnique({
    where: { id: user.agencyId },
    select: { useCommissionTiers: true },
  });
  if (!agency?.useCommissionTiers) return fallback;

  const tiers = await prisma.commissionTier.findMany({
    where: { agencyId: user.agencyId },
    orderBy: { minRevenue: "desc" },
  });
  if (tiers.length === 0) return fallback;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [flightSum, hotelSum, pkgSum, visaSum] = await Promise.all([
    prisma.booking.aggregate({
      where: { userId: user.id, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.hotelBooking.aggregate({
      where: { userId: user.id, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.packageBooking.aggregate({
      where: { userId: user.id, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.visaBooking.aggregate({
      where: { userId: user.id, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
  ]);

  const monthRevenue =
    Number(flightSum._sum.totalAmount ?? 0) +
    Number(hotelSum._sum.totalAmount ?? 0) +
    Number(pkgSum._sum.totalAmount ?? 0) +
    Number(visaSum._sum.totalAmount ?? 0);

  const matched = tiers.find((t) => monthRevenue >= Number(t.minRevenue));
  return matched ? Number(matched.commissionPct) : fallback;
}