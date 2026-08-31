"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { Role } from "@prisma/client";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== Role.SUPER_ADMIN) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user;
}

export type AgencyOverviewRow = {
  id: string;
  name: string;
  isActive: boolean;
  subAgentCount: number;
  bookingCount: number;
  totalRevenue: number;
  createdAt: string;
};

export type PlatformOverview = {
  agencies: AgencyOverviewRow[];
  totals: { agencyCount: number; activeCount: number; bookingCount: number; revenue: number };
};

// Read-only, platform-wide view — Super Admin oversight, not a gatekeeper.
// Agencies get full access the moment they register; the only control
// here is suspending an agency that's misbehaving.
export async function getPlatformOverview(): Promise<PlatformOverview> {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) {
    return { agencies: [], totals: { agencyCount: 0, activeCount: 0, bookingCount: 0, revenue: 0 } };
  }

  const agencies = await prisma.agency.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { where: { role: Role.SUB_AGENT }, select: { id: true } },
    },
  });

  const rows: AgencyOverviewRow[] = [];
  for (const agency of agencies) {
    const [flightSum, hotelSum, packageSum, visaSum, flightCount, hotelCount, packageCount, visaCount] =
      await Promise.all([
        prisma.booking.aggregate({
          where: { agencyId: agency.id, status: { not: "CANCELLED" } },
          _sum: { totalAmount: true },
        }),
        prisma.hotelBooking.aggregate({
          where: { agencyId: agency.id, status: { not: "CANCELLED" } },
          _sum: { totalAmount: true },
        }),
        prisma.packageBooking.aggregate({
          where: { agencyId: agency.id, status: { not: "CANCELLED" } },
          _sum: { totalAmount: true },
        }),
        prisma.visaBooking.aggregate({
          where: { agencyId: agency.id, status: { not: "CANCELLED" } },
          _sum: { totalAmount: true },
        }),
        prisma.booking.count({ where: { agencyId: agency.id } }),
        prisma.hotelBooking.count({ where: { agencyId: agency.id } }),
        prisma.packageBooking.count({ where: { agencyId: agency.id } }),
        prisma.visaBooking.count({ where: { agencyId: agency.id } }),
      ]);

    const totalRevenue =
      Number(flightSum._sum.totalAmount ?? 0) +
      Number(hotelSum._sum.totalAmount ?? 0) +
      Number(packageSum._sum.totalAmount ?? 0) +
      Number(visaSum._sum.totalAmount ?? 0);

    rows.push({
      id: agency.id,
      name: agency.name,
      isActive: agency.isActive,
      subAgentCount: agency.users.length,
      bookingCount: flightCount + hotelCount + packageCount + visaCount,
      totalRevenue,
      createdAt: agency.createdAt.toISOString(),
    });
  }

  const totals = {
    agencyCount: rows.length,
    activeCount: rows.filter((r) => r.isActive).length,
    bookingCount: rows.reduce((s, r) => s + r.bookingCount, 0),
    revenue: rows.reduce((s, r) => s + r.totalRevenue, 0),
  };

  return { agencies: rows, totals };
}

export type PlatformActionState = { error?: string; success?: boolean };

export async function toggleAgencyStatus(agencyId: string): Promise<PlatformActionState> {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) return { error: "Not authorized" };

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) return { error: "Agency not found" };

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({ where: { id: agencyId }, data: { isActive: !agency.isActive } });

    await logActivity(tx, {
      actorId: superAdmin.id,
      agencyId: agency.id,
      action: "AGENCY_MARKUP_UPDATED",
      description: `Platform admin ${!agency.isActive ? "activated" : "suspended"} agency ${agency.name}`,
    });
  });

  revalidatePath("/admin/platform");
  return { success: true };
}