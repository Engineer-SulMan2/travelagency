import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { CalendarRange, Briefcase, TrendingUp, Award } from "lucide-react";

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function SummaryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const agency = user.agencyId
    ? await prisma.agency.findUnique({ where: { id: user.agencyId }, select: { currency: true } })
    : null;
  const currency = agency?.currency ?? "PKR";
  const formatMoney = (n: number) => formatCurrency(n, currency);

  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  async function periodStats(since: Date) {
    const [flights, hotels, packages, visas, commissions] = await Promise.all([
      prisma.booking.findMany({ where: { userId: user!.id, status: { not: "CANCELLED" }, createdAt: { gte: since } }, select: { totalAmount: true } }),
      prisma.hotelBooking.findMany({ where: { userId: user!.id, status: { not: "CANCELLED" }, createdAt: { gte: since } }, select: { totalAmount: true } }),
      prisma.packageBooking.findMany({ where: { userId: user!.id, status: { not: "CANCELLED" }, createdAt: { gte: since } }, select: { totalAmount: true } }),
      prisma.visaBooking.findMany({ where: { userId: user!.id, status: { not: "CANCELLED" }, createdAt: { gte: since } }, select: { totalAmount: true } }),
      prisma.commissionEntry.findMany({ where: { userId: user!.id, createdAt: { gte: since } }, select: { commissionAmount: true } }),
    ]);

    const allBookings = [...flights, ...hotels, ...packages, ...visas];
    const revenue = allBookings.reduce((s, b) => s + Number(b.totalAmount), 0);
    const commission = commissions.reduce((s, c) => s + Number(c.commissionAmount), 0);

    return { count: allBookings.length, revenue, commission };
  }

  const [weekStats, monthStats] = await Promise.all([periodStats(weekStart), periodStats(monthStart)]);

  const cards = [
    {
      title: "This week",
      subtitle: "Since Monday",
      stats: weekStats,
    },
    {
      title: "This month",
      subtitle: "Since the 1st",
      stats: monthStats,
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">My Summary</h1>
      <p className="mb-6 text-sm text-slate-500">A quick recap of your bookings and commission, week and month to date.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <CalendarRange className="h-4 w-4 text-indigo-600" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                <p className="text-xs text-slate-400">{c.subtitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
                  <Briefcase className="h-4 w-4 text-sky-600" />
                </div>
                <p className="text-lg font-semibold text-slate-900">{c.stats.count}</p>
                <p className="text-xs text-slate-400">Bookings</p>
              </div>
              <div>
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-lg font-semibold text-slate-900">{formatMoney(c.stats.revenue)}</p>
                <p className="text-xs text-slate-400">Booked value</p>
              </div>
              <div>
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-lg font-semibold text-slate-900">{formatMoney(c.stats.commission)}</p>
                <p className="text-xs text-slate-400">Commission</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}