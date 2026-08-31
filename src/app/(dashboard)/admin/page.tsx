import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReportsData } from "@/lib/reports-query";
import { getUnifiedBookings } from "@/lib/bookings-query";
import { DailyBookingsChart } from "@/components/reports/daily-bookings-chart";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { formatCurrency } from "@/lib/currency";
import {
  Users,
  Briefcase,
  Wallet,
  TrendingUp,
  Percent,
  Award,
  ArrowRight,
  Plane,
  UserPlus,
} from "lucide-react";

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

export default async function AdminDashboardPage() {
  const session = await auth();
  if (session?.user.role === "SUPER_ADMIN") redirect("/admin/platform");

  const agencyId = session?.user.agencyId;

  const admin = session
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  const [subAgents, reportsData, recentBookings, agency, agencyPackageCount] = await Promise.all([
    agencyId
      ? prisma.user.findMany({
          where: { agencyId, role: "SUB_AGENT" },
          include: { commissionEntries: { select: { commissionAmount: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    getReportsData(agencyId),
    getUnifiedBookings({ agencyId }),
    agencyId ? prisma.agency.findUnique({ where: { id: agencyId } }) : null,
    agencyId ? prisma.package.count({ where: { agencyId } }) : Promise.resolve(0),
  ]);

  const checklistItems = [
    { label: "Add your first sub-agent", done: subAgents.length > 0, href: "/admin/sub-agents" },
    { label: "Upload your agency logo", done: !!agency?.logoUrl, href: "/admin/settings" },
    { label: "Set your business hours", done: !!agency?.businessHours, href: "/admin/settings" },
    { label: "Add a holiday package", done: agencyPackageCount > 0, href: "/admin/packages/manage" },
    { label: "Make your first booking", done: reportsData.totals.bookingCount > 0, href: "/admin/flights" },
  ];

  const topSubAgents = subAgents
    .map((a) => ({
      id: a.id,
      name: a.name,
      bookingCount: a.commissionEntries.length,
      commissionEarned: a.commissionEntries.reduce((s, c) => s + Number(c.commissionAmount), 0),
    }))
    .sort((a, b) => b.commissionEarned - a.commissionEarned)
    .slice(0, 5);

  const latestBookings = recentBookings.slice(0, 6);

  const currency = agency?.currency ?? "PKR";
  const formatMoney = (n: number) => formatCurrency(n, currency);

  const kpis = [
    { label: "Sub-Agents", value: subAgents.length, icon: Users, color: "bg-indigo-50 text-indigo-600" },
    { label: "Total Bookings", value: reportsData.totals.bookingCount, icon: Briefcase, color: "bg-emerald-50 text-emerald-600" },
    { label: "Revenue", value: formatMoney(reportsData.totals.revenue), icon: TrendingUp, color: "bg-sky-50 text-sky-600" },
    { label: "Total Markup", value: formatMoney(reportsData.totals.markup), icon: Percent, color: "bg-amber-50 text-amber-600" },
    { label: "Commission Paid", value: formatMoney(reportsData.totals.commissionPaid), icon: Award, color: "bg-violet-50 text-violet-600" },
    { label: "Wallet Balance", value: formatMoney(Number(admin?.walletBalance ?? 0)), icon: Wallet, color: "bg-rose-50 text-rose-600" },
  ];

  const quickActions = [
    { label: "Add sub-agent", href: "/admin/sub-agents", icon: UserPlus },
    { label: "Book a flight", href: "/admin/flights", icon: Plane },
    { label: "View reports", href: "/admin/reports", icon: TrendingUp },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">
        Welcome back{session?.user.name ? `, ${session.user.name}` : ""}
      </h1>
      <p className="mb-8 text-sm text-slate-500">Here&apos;s the full overview of your agency.</p>

      <OnboardingChecklist items={checklistItems} />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500">{s.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {quickActions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <a.icon className="h-4 w-4" />
            {a.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chart + recent bookings */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-900">Bookings — last 14 days</p>
            <DailyBookingsChart data={reportsData.dailyBookings} />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Recent bookings</p>
              <Link href="/admin/bookings" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {latestBookings.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No bookings yet.</p>
            ) : (
              <div className="space-y-1">
                {latestBookings.map((b) => (
                  <div
                    key={`${b.type}-${b.id}`}
                    className="flex items-center justify-between rounded-xl px-2 py-2.5 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[b.type]}`}>
                        {TYPE_LABELS[b.type]}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{b.title}</p>
                        <p className="text-xs text-slate-500">{b.bookedBy} · {b.subtitle}</p>
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
        </div>

        {/* Top sub-agents leaderboard */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Top sub-agents</p>
            <Link href="/admin/sub-agents" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {topSubAgents.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No sub-agents yet.</p>
          ) : (
            <div className="space-y-1">
              {topSubAgents.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.bookingCount} booking{a.bookingCount !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-emerald-600">
                    {formatMoney(a.commissionEarned)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}