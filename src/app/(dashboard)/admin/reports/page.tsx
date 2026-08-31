import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReportsData } from "@/lib/reports-query";
import { formatCurrency } from "@/lib/currency";
import { DailyBookingsChart } from "@/components/reports/daily-bookings-chart";
import { ExportReportButton } from "@/components/reports/export-report-button";
import { Briefcase, TrendingUp, Percent, Award, PiggyBank, BarChart3 } from "lucide-react";

const PRODUCT_LABELS: Record<string, string> = {
  FLIGHT: "Flights",
  HOTEL: "Hotels",
  PACKAGE: "Packages",
  VISA: "Visa",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  const [data, agency] = await Promise.all([
    getReportsData(admin?.agencyId),
    admin?.agencyId ? prisma.agency.findUnique({ where: { id: admin.agencyId }, select: { currency: true } }) : null,
  ]);

  const currency = agency?.currency ?? "PKR";
  const formatMoney = (n: number) => formatCurrency(n, currency);

  const kpis = [
    { label: "Bookings", value: data.totals.bookingCount, icon: Briefcase, color: "bg-sky-50 text-sky-600" },
    { label: "Revenue", value: formatMoney(data.totals.revenue), icon: TrendingUp, color: "bg-indigo-50 text-indigo-600" },
    { label: "Total markup", value: formatMoney(data.totals.markup), icon: Percent, color: "bg-amber-50 text-amber-600" },
    { label: "Commission paid", value: formatMoney(data.totals.commissionPaid), icon: Award, color: "bg-emerald-50 text-emerald-600" },
    { label: "Agency share", value: formatMoney(data.totals.agencyShare), icon: PiggyBank, color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">Sales overview across flights, hotels and packages.</p>
        </div>
        <ExportReportButton byProduct={data.byProduct} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Bookings — last 14 days</p>
        </div>
        <DailyBookingsChart data={data.dailyBookings} />
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-slate-900">By product</p>
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <th className="pb-3 pr-4">Product</th>
              <th className="pb-3 pr-4">Bookings</th>
              <th className="pb-3 pr-4">Revenue</th>
              <th className="pb-3">Commission paid</th>
            </tr>
          </thead>
          <tbody>
            {data.byProduct.map((p) => (
              <tr key={p.type} className="border-b border-slate-50 text-sm transition-colors last:border-0 hover:bg-slate-50/60">
                <td className="py-3.5 pr-4 font-medium text-slate-900">{PRODUCT_LABELS[p.type]}</td>
                <td className="py-3.5 pr-4 text-slate-700">{p.count}</td>
                <td className="py-3.5 pr-4 text-slate-700">{formatMoney(p.revenue)}</td>
                <td className="py-3.5 font-medium text-emerald-600">{formatMoney(p.commission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}