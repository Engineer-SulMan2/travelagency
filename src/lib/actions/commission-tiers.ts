"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type TierActionState = {
  error?: string;
  success?: boolean;
};

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

export async function addCommissionTier(
  _prev: TierActionState,
  formData: FormData
): Promise<TierActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!currentUser || !currentUser.agencyId) {
    return { error: "Unauthorized" };
  }

  // Only Agency Admin or Super Admin can manage tiers
  if (
    currentUser.role !== Role.AGENCY_ADMIN &&
    currentUser.role !== Role.SUPER_ADMIN
  ) {
    return { error: "Only agency admins can manage commission tiers" };
  }

  const label = String(formData.get("label") || "").trim();
  const minRevenue = Number(formData.get("minRevenue"));
  const commissionPct = Number(formData.get("commissionPct"));

  if (!label) return { error: "Label is required" };
  if (isNaN(minRevenue) || minRevenue < 0) return { error: "Invalid minimum revenue" };
  if (isNaN(commissionPct) || commissionPct < 0 || commissionPct > 100) {
    return { error: "Commission % must be between 0 and 100" };
  }

  try {
    await prisma.commissionTier.create({
      data: {
        agencyId: currentUser.agencyId,
        label,
        minRevenue,
        commissionPct,
      },
    });

    revalidatePath("/settings"); // adjust path if needed
    return { success: true };
  } catch (error) {
    console.error("addCommissionTier error:", error);
    return { error: "Failed to add commission tier" };
  }
}

export async function deleteCommissionTier(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!currentUser || !currentUser.agencyId) return;

  if (
    currentUser.role !== Role.AGENCY_ADMIN &&
    currentUser.role !== Role.SUPER_ADMIN
  ) {
    return;
  }

  // Make sure the tier belongs to this agency
  const tier = await prisma.commissionTier.findFirst({
    where: { id, agencyId: currentUser.agencyId },
  });
  if (!tier) return;

  await prisma.commissionTier.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function toggleCommissionTiers() {
  const session = await auth();
  if (!session?.user?.id) return;

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!currentUser || !currentUser.agencyId) return;

  if (
    currentUser.role !== Role.AGENCY_ADMIN &&
    currentUser.role !== Role.SUPER_ADMIN
  ) {
    return;
  }

  const agency = await prisma.agency.findUnique({
    where: { id: currentUser.agencyId },
    select: { useCommissionTiers: true },
  });
  if (!agency) return;

  await prisma.agency.update({
    where: { id: currentUser.agencyId },
    data: { useCommissionTiers: !agency.useCommissionTiers },
  });

  revalidatePath("/settings");
}