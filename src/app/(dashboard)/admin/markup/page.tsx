import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { AgencyMarkupForm } from "@/components/markup/agency-markup-form";
import { CommissionBreakdownTable } from "@/components/markup/commission-breakdown-table";

export default async function MarkupPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/admin/platform");

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin) redirect("/login");

  const agency = admin.agencyId
    ? await prisma.agency.findUnique({ where: { id: admin.agencyId } })
    : null;

  const currency = agency?.currency ?? "PKR";
  const formatMoney = (n: number) => formatCurrency(n, currency);

  const subAgents = await prisma.user.findMany({
    where: { agencyId: admin.agencyId, role: "SUB_AGENT" },
    include: {
      _count: { select: { bookings: true } },
      commissionEntries: { select: { markupAmount: true, commissionAmount: true, agencyShare: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = subAgents.map((a) => {
    const totalMarkup = a.commissionEntries.reduce((s, c) => s + Number(c.markupAmount), 0);
    const totalCommission = a.commissionEntries.reduce((s, c) => s + Number(c.commissionAmount), 0);
    const totalAgencyShare = a.commissionEntries.reduce((s, c) => s + Number(c.agencyShare), 0);

    return {
      id: a.id,
      name: a.name,
      markupPct: Number(a.defaultMarkupPct),
      commissionPct: Number(a.commissionPct),
      bookingCount: a._count.bookings,
      totalMarkup,
      totalCommission,
      totalAgencyShare,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      markup: acc.markup + r.totalMarkup,
      commission: acc.commission + r.totalCommission,
      agencyShare: acc.agencyShare + r.totalAgencyShare,
    }),
    { markup: 0, commission: 0, agencyShare: 0 }
  );

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Markup &amp; Commission</h1>
      <p className="mb-6 text-sm text-slate-500">
        Set your agency default and see how much every sub-agent has earned so far.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total markup generated</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{formatMoney(totals.markup)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Paid out as commission</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{formatMoney(totals.commission)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Agency share</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{formatMoney(totals.agencyShare)}</p>
        </div>
      </div>

      <div className="mb-5">
        <AgencyMarkupForm currentPct={Number(agency?.defaultMarkupPct ?? 5)} />
      </div>

      <CommissionBreakdownTable rows={rows} currency={currency} />

      <p className="mt-3 text-xs text-slate-400">
        To change an individual sub-agent&apos;s markup or commission %, use the{" "}
        <a href="/admin/sub-agents" className="underline">
          Sub-Agents
        </a>{" "}
        page.
      </p>
    </div>
  );
}