import { prisma } from "@/lib/prisma";
import type { PackageSummary } from "@/types/package";
import type { PackageCategory } from "@prisma/client";

export async function getPackageCatalog(
  agencyId: string | null | undefined,
  category: PackageCategory
): Promise<PackageSummary[]> {
  const packages = await prisma.package.findMany({
    where: {
      isActive: true,
      category,
      OR: [{ agencyId: agencyId ?? null }, { agencyId: null }],
      // Expired packages (validUntil in the past) never reach the
      // sub-agent-facing catalog — they still exist and stay visible to
      // the agency admin on Manage Packages, just marked "Expired" there.
      AND: [{ OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] }],
    },
    orderBy: { createdAt: "desc" },
  });

  const results: PackageSummary[] = [];

  for (const p of packages) {
    let remainingSeats: number | null = null;

    if (p.maxSeats != null) {
      const booked = await prisma.packageBooking.aggregate({
        where: { packageId: p.id, status: { not: "CANCELLED" } },
        _sum: { travelers: true },
      });
      remainingSeats = Math.max(0, p.maxSeats - (booked._sum.travelers ?? 0));
    }

    // Sold-out packages are hidden from the booking catalog entirely.
    if (remainingSeats === 0) continue;

    results.push({
      id: p.id,
      title: p.title,
      destination: p.destination,
      durationDays: p.durationDays,
      description: p.description,
      inclusions: p.inclusions,
      basePrice: Number(p.basePrice),
      isActive: p.isActive,
      images: p.images,
      maxSeats: p.maxSeats,
      remainingSeats,
    });
  }

  return results;
}