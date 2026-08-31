import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { CreatePayoutForm } from "@/components/payouts/create-payout-form";
import { Wallet as WalletIcon } from "lucide-react";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function PayoutsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/admin/platform");

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin) redirect("/login");

  const [batches, agency] = await Promise.all([
    prisma.payoutBatch.findMany({
      where: { agencyId: admin.agencyId },
      orderBy: { createdAt: "desc" },
      include: { entries: true },
    }),
    admin.agencyId ? prisma.agency.findUnique({ where: { id: admin.agencyId }, select: { currency: true } }) : null,
  ]);

  const currency = agency?.currency ?? "PKR";
  const formatMoney = (n: number) => formatCurrency(n, currency);

  const userIds = Array.from(new Set(batches.flatMap((b) => b.entries.map((e) => e.userId))));
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
  const nameMap = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Commission Payouts</h1>
      <p className="mb-6 text-sm text-slate-500">
        Settle earned commission out to sub-agents for a period — debits their wallet and records the batch.
      </p>

      <div className="mb-5">
        <CreatePayoutForm />
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <WalletIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="mt-4 text-sm text-slate-500">No payout batches yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div key={batch.id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatDate(batch.periodStart)} → {formatDate(batch.periodEnd)}
                  </p>
                  <p className="text-xs text-slate-400">Created {formatDate(batch.createdAt)}</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {formatMoney(Number(batch.totalAmount))}
                </span>
              </div>
              <div className="space-y-1">
                {batch.entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                    <span className="text-slate-700">{nameMap.get(e.userId) ?? "Unknown"}</span>
                    <span className="font-medium text-emerald-600">{formatMoney(Number(e.commissionAmount))}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}