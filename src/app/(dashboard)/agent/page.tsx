import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUnifiedBookings } from "@/lib/bookings-query";
import { formatCurrency } from "@/lib/currency";
import { ExportMySalesButton } from "@/components/dashboard/export-my-sales-button";
import { TierProgressCard } from "@/components/dashboard/tier-progress-card";
import { GoalProgressCard } from "@/components/dashboard/goal-progress-card";
import { DueRemindersCard } from "@/components/dashboard/due-reminders-card";
import { getMyTierProgress } from "@/lib/tier-progress";
import { getMyGoalProgress } from "@/lib/actions/goals";
import { ArrowRight, Briefcase, Wallet, Percent, IdCard, Plane, Building2, Package as PackageIcon, Stamp, Sparkles } from "lucide-react";

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

export default async function AgentDashboardPage() {
  const session = await auth();
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  const [bookings, agency, tierProgress, dueReminders, goalProgress] = await Promise.all([
    session ? getUnifiedBookings({ userId: session.user.id }) : Promise.resolve([]),
    user?.agencyId ? prisma.agency.findUnique({ where: { id: user.agencyId }, select: { name: true, currency: true } }) : null,
    user ? getMyTierProgress(user.id, user.agencyId) : Promise.resolve({ enabled: false, monthRevenue: 0, currentTier: null, nextTier: null }),
    user
      ? prisma.reminder.findMany({
          where: { userId: user.id, completed: false, dueAt: { lte: new Date(new Date().setHours(23, 59, 59, 999)) } },
          orderBy: { dueAt: "asc" },
          take: 4,
          include: { customer: { select: { fullName: true } } },
        })
      : Promise.resolve([]),
    user ? getMyGoalProgress(user.id) : Promise.resolve({ targetAmount: null, monthRevenue: 0 }),
  ]);

  const currency = agency?.currency ?? "PKR";
  const formatMoney = (n: number) => formatCurrency(n, currency);

  const activeBookings = bookings.filter((b) => b.status !== "CANCELLED");
  const totalSpent = activeBookings.reduce((s, b) => s + b.totalAmount, 0);
  const latestBookings = bookings.slice(0, 6);

  const kpis = [
    { label: "My Bookings", value: bookings.length, icon: Briefcase, color: "bg-indigo-50 text-indigo-600" },
    { label: "Total Booked Value", value: formatMoney(totalSpent), icon: Sparkles, color: "bg-emerald-50 text-emerald-600" },
    { label: "Wallet Balance", value: formatMoney(Number(user?.walletBalance ?? 0)), icon: Wallet, color: "bg-rose-50 text-rose-600" },
    { label: "My Markup %", value: `${Number(user?.defaultMarkupPct ?? 0)}%`, icon: Percent, color: "bg-amber-50 text-amber-600" },
  ];

  const quickActions = [
    { label: "Search flights", href: "/agent/flights", icon: Plane },
    { label: "Search hotels", href: "/agent/hotels", icon: Building2 },
    { label: "Browse packages", href: "/agent/packages", icon: PackageIcon },
    { label: "Visa bookings", href: "/agent/visa", icon: Stamp },
    { label: "My digital card", href: `/card/${session?.user.id}`, icon: IdCard },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 shadow-lg shadow-indigo-200 sm:p-8">
        <div className="flex items-center gap-2 text-indigo-100">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">{agency?.name ?? "Your agency"}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Welcome back{session?.user.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-indigo-100">Search flights, hotels or packages and manage your bookings.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Reminders + tier progress + goal */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DueRemindersCard
          reminders={dueReminders.map((r) => ({
            id: r.id,
            note: r.note,
            dueAt: r.dueAt.toISOString(),
            customerName: r.customer?.fullName ?? null,
          }))}
        />
        <TierProgressCard progress={tierProgress} currency={currency} />
        <GoalProgressCard targetAmount={goalProgress.targetAmount} monthRevenue={goalProgress.monthRevenue} currency={currency} />
      </div>

      {/* Recent bookings */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Recent bookings</p>
          <div className="flex items-center gap-3">
            {bookings.length > 0 && <ExportMySalesButton bookings={bookings} />}
            <Link href="/agent/bookings" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {latestBookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No bookings yet — start with Flights, Hotels or Packages above.</p>
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
    </div>
  );
}