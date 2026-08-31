import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPlatformOverview } from "@/lib/actions/platform";
import { AgenciesTable } from "@/components/platform/agencies-table";
import { Building2, Briefcase, TrendingUp, CheckCircle2 } from "lucide-react";

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

export default async function PlatformPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/admin");

  const { agencies, totals } = await getPlatformOverview();

  const kpis = [
    { label: "Agencies", value: totals.agencyCount, icon: Building2, color: "bg-indigo-50 text-indigo-600" },
    { label: "Active Agencies", value: totals.activeCount, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Total Bookings", value: totals.bookingCount, icon: Briefcase, color: "bg-sky-50 text-sky-600" },
    { label: "Platform Revenue", value: formatMoney(totals.revenue), icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Platform Overview</h1>
      <p className="mb-6 text-sm text-slate-500">
        Every agency registered on this platform — as the platform owner, you see them all.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${k.color}`}>
              <k.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500">{k.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      <AgenciesTable agencies={agencies} />
    </div>
  );
}