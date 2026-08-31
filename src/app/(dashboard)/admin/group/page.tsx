import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPackageCatalog } from "@/lib/package-catalog-query";
import { PackageCatalog } from "@/components/packages/package-catalog";

export default async function AdminGroupPage() {
  const session = await auth();
  const user = session ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
  const agency = user?.agencyId
    ? await prisma.agency.findUnique({ where: { id: user.agencyId }, select: { currency: true } })
    : null;
  const rows = await getPackageCatalog(user?.agencyId, "GROUP");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-lg font-semibold text-slate-900">Group Bookings</h1>
          <p className="text-sm text-slate-500">Curated group packages — book directly for a customer.</p>
        </div>
        <Link
          href="/admin/packages/manage"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Manage catalog
        </Link>
      </div>
      <PackageCatalog packages={rows} markupPct={user ? Number(user.defaultMarkupPct) : 0} currency={agency?.currency ?? "PKR"} />
    </div>
  );
}