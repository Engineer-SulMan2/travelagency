import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { AddPackageForm } from "@/components/packages/add-package-form";
import { BulkImportPackages } from "@/components/packages/bulk-import-packages";
import { ManagePackageRow } from "@/components/packages/manage-package-row";

export default async function ManagePackagesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (![Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(session.user.role as Role)) {
    redirect("/agent");
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  const agency = admin?.agencyId
    ? await prisma.agency.findUnique({ where: { id: admin.agencyId }, select: { currency: true } })
    : null;

  const packages = await prisma.package.findMany({
    where: { agencyId: admin?.agencyId },
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  });

  const bookedSeatsMap = new Map<string, number>();
  const seatAggregates = await prisma.packageBooking.groupBy({
    by: ["packageId"],
    where: { packageId: { in: packages.map((p) => p.id) }, status: { not: "CANCELLED" } },
    _sum: { travelers: true },
  });
  for (const agg of seatAggregates) {
    bookedSeatsMap.set(agg.packageId, agg._sum.travelers ?? 0);
  }

  const rows = packages.map((p) => ({
    id: p.id,
    title: p.title,
    destination: p.destination,
    durationDays: p.durationDays,
    basePrice: Number(p.basePrice),
    category: p.category,
    isActive: p.isActive,
    bookingCount: p._count.bookings,
    images: p.images,
    maxSeats: p.maxSeats,
    bookedSeats: bookedSeatsMap.get(p.id) ?? 0,
    validUntil: p.validUntil ? p.validUntil.toISOString() : null,
  }));

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Manage packages</h1>
      <p className="mb-6 text-sm text-slate-500">
        Create and manage your agency&apos;s package catalog — Holiday, Tour, Umrah and Group Bookings all live here, split by category.
      </p>

      <div className="mb-5 flex flex-wrap items-start gap-3">
        <AddPackageForm />
        <BulkImportPackages />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No packages yet. Add your first one above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Package</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4">Base price</th>
                <th className="pb-2 pr-4">Seats</th>
                <th className="pb-2 pr-4">Bookings</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Expiry</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((pkg) => (
                <ManagePackageRow key={pkg.id} pkg={pkg} currency={agency?.currency ?? "PKR"} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}