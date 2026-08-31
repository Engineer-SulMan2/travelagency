import { prisma } from "@/lib/prisma";

export type TierProgress = {
  enabled: boolean;
  monthRevenue: number;
  currentTier: { label: string; commissionPct: number } | null;
  nextTier: { label: string; minRevenue: number; commissionPct: number } | null;
};

// Same monthly-revenue calculation as getEffectiveCommissionPct, but
// returns the full picture (current tier + next tier + progress) instead
// of just the number to apply, so the sub-agent can see where they stand.
export async function getMyTierProgress(userId: string, agencyId: string | null): Promise<TierProgress> {
  const empty: TierProgress = { enabled: false, monthRevenue: 0, currentTier: null, nextTier: null };
  if (!agencyId) return empty;

  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { useCommissionTiers: true },
  });
  if (!agency?.useCommissionTiers) return empty;

  const tiers = await prisma.commissionTier.findMany({
    where: { agencyId },
    orderBy: { minRevenue: "asc" },
  });
  if (tiers.length === 0) return { ...empty, enabled: true };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [flightSum, hotelSum, pkgSum, visaSum] = await Promise.all([
    prisma.booking.aggregate({
      where: { userId, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.hotelBooking.aggregate({
      where: { userId, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.packageBooking.aggregate({
      where: { userId, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.visaBooking.aggregate({
      where: { userId, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
  ]);

  const monthRevenue =
    Number(flightSum._sum.totalAmount ?? 0) +
    Number(hotelSum._sum.totalAmount ?? 0) +
    Number(pkgSum._sum.totalAmount ?? 0) +
    Number(visaSum._sum.totalAmount ?? 0);

  const descByRevenue = [...tiers].sort((a, b) => Number(b.minRevenue) - Number(a.minRevenue));
  const matched = descByRevenue.find((t) => monthRevenue >= Number(t.minRevenue));
  const currentTier = matched ? { label: matched.label, commissionPct: Number(matched.commissionPct) } : null;

  const nextTierRow = tiers.find((t) => Number(t.minRevenue) > monthRevenue);
  const nextTier = nextTierRow
    ? {
        label: nextTierRow.label,
        minRevenue: Number(nextTierRow.minRevenue),
        commissionPct: Number(nextTierRow.commissionPct),
      }
    : null;

  return { enabled: true, monthRevenue, currentTier, nextTier };
}