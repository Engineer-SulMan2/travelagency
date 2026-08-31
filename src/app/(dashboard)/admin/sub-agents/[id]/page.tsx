import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUnifiedBookings } from "@/lib/bookings-query";
import { DailyBookingsChart } from "@/components/reports/daily-bookings-chart";
import { DocumentsSection } from "@/components/sub-agents/documents-section";
import { formatCurrency } from "@/lib/currency";
import { ArrowLeft, Briefcase, TrendingUp, Award, Wallet, Percent } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  FLIGHT: "Flight",
  HOTEL: "Hotel",
  PACKAGE: "Package",
  VISA: "Visa",
};

const TYPE_STYLES: Record<string, string> = {
  FLIGHT: "bg-sky-50 text-sky-700",
  HOTEL: "bg-violet-50 text-violet-700",
  PACKAGE: "bg-amber-50 text-amber-700",
  VISA: "bg-rose-50 text-rose-700",
};

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-50 text-red-700",
};

export default async function SubAgentPerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/admin/platform");

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin) redirect("/login");

  const agent = await prisma.user.findUnique({ where: { id } });
  if (!agent || agent.agencyId !== admin.agencyId || agent.role !== "SUB_AGENT") notFound();

  const [bookings, commissionEntries, documents, agency] = await Promise.all([
    getUnifiedBookings({ userId: agent.id }),
    prisma.commissionEntry.findMany({ where: { userId: agent.id }, select: { commissionAmount: true, createdAt: true } }),
    prisma.subAgentDocument.findMany({ where: { userId: agent.id }, orderBy: { createdAt: "desc" } }),
    agent.agencyId ? prisma.agency.findUnique({ where: { id: agent.agencyId }, select: { currency: true } }) : null,
  ]);

  const formatMoney = (n: number) => formatCurrency(n, agency?.currency ?? "PKR");

  const activeBookings = bookings.filter((b) => b.status !== "CANCELLED");
  const totalRevenue = activeBookings.reduce((s, b) => s + b.totalAmount, 0);
  const totalCommission = commissionEntries.reduce((s, c) => s + Number(c.commissionAmount), 0);
  const avgBookingValue = activeBookings.length > 0 ? totalRevenue / activeBookings.length : 0;

  // Last 30 days booking trend
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    dayBuckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const b of bookings) {
    const day = new Date(b.createdAt).toISOString().slice(0, 10);
    if (dayBuckets.has(day)) dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1);
  }
  const dailyData = Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count }));

  const kpis = [
    { label: "Total Bookings", value: bookings.length, icon: Briefcase, color: "bg-indigo-50 text-indigo-600" },
    { label: "Revenue Generated", value: formatMoney(totalRevenue), icon: TrendingUp, color: "bg-sky-50 text-sky-600" },
    { label: "Commission Earned", value: formatMoney(totalCommission), icon: Award, color: "bg-emerald-50 text-emerald-600" },
    { label: "Avg Booking Value", value: formatMoney(Math.round(avgBookingValue)), icon: Percent, color: "bg-amber-50 text-amber-600" },
    { label: "Wallet Balance", value: formatMoney(Number(agent.walletBalance)), icon: Wallet, color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div>
      <Link href="/admin/sub-agents" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to sub-agents
      </Link>

      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">{agent.name}</h1>
      <p className="mb-6 text-sm text-slate-500">{agent.email} · Markup {Number(agent.defaultMarkupPct)}% · Commission {Number(agent.commissionPct)}%</p>

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

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-900">Bookings — last 30 days</p>
        <DailyBookingsChart data={dailyData} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-900">Recent bookings</p>
        {bookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No bookings yet.</p>
        ) : (
          <div className="space-y-1">
            {bookings.slice(0, 10).map((b) => (
              <div key={`${b.type}-${b.id}`} className="flex items-center justify-between rounded-xl px-2 py-2.5 transition hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[b.type]}`}>
                    {TYPE_LABELS[b.type]}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{b.title}</p>
                    <p className="text-xs text-slate-500">{b.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-900">{formatMoney(b.totalAmount)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-5">
        <DocumentsSection
          userId={agent.id}
          documents={documents.map((d) => ({
            id: d.id,
            name: d.name,
            fileType: d.fileType,
            fileData: d.fileData,
            createdAt: d.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}