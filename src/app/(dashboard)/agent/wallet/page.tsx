import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { Lock, CheckCircle2, XCircle, Clock } from "lucide-react";
import { isSafepayConfigured } from "@/lib/safepay";
import { TopUpForm } from "@/components/wallet/topup-form";
import { TransactionsTable, type WalletTransactionRow } from "@/components/wallet/transactions-table";

export default async function AgentWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string }>;
}) {
  const { topup } = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const [transactions, agency] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    user.agencyId ? prisma.agency.findUnique({ where: { id: user.agencyId }, select: { currency: true } }) : null,
  ]);

  const currency = agency?.currency ?? "PKR";

  const rows: WalletTransactionRow[] = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    reason: t.reason,
    amount: Number(t.amount),
    balanceAfter: Number(t.balanceAfter),
    description: t.description,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">My Wallet</h1>
      <p className="mb-6 text-sm text-slate-500">
        Bookings debit their net cost from here; your commission is credited back automatically.
      </p>

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Current balance</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {formatCurrency(Number(user.walletBalance), currency)}
        </p>
      </div>

      {topup === "success" && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">Payment received</p>
            <p className="mt-0.5 text-xs text-emerald-600">
              Your balance updates automatically within a few seconds once Safepay confirms the payment.
              Refresh this page if it doesn&apos;t appear right away.
            </p>
          </div>
        </div>
      )}
      {topup === "cancelled" && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <XCircle className="h-4 w-4 shrink-0 text-slate-500" />
          <p className="text-sm text-slate-600">Payment was cancelled — no charge was made.</p>
        </div>
      )}

      {user.walletLocked ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-700">Your wallet is locked</p>
            <p className="mt-0.5 text-xs text-red-600">
              Your agency admin has locked your wallet — you can&apos;t make new bookings or top up right now.
              Contact them to have it unlocked.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <TopUpForm isLive={isSafepayConfigured()} />
        </div>
      )}

      <TransactionsTable transactions={rows} currency={currency} />
    </div>
  );
}