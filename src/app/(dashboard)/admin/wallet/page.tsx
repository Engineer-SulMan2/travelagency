import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { TopUpForm } from "@/components/wallet/topup-form";
import { TransactionsTable, type WalletTransactionRow } from "@/components/wallet/transactions-table";
import { AdjustWalletForm } from "@/components/wallet/adjust-wallet-form";

export default async function AdminWalletPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const [transactions, subAgents, agency] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.user.findMany({
      where: { agencyId: user.agencyId, role: "SUB_AGENT" },
      select: { id: true, name: true, walletBalance: true },
      orderBy: { name: "asc" },
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
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Wallet</h1>
      <p className="mb-6 text-sm text-slate-500">Your own wallet, plus tools to adjust sub-agent wallets.</p>

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Current balance</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {formatCurrency(Number(user.walletBalance), currency)}
        </p>
      </div>

      <div className="mb-5">
        <TopUpForm />
      </div>

      <div className="mb-5">
        <AdjustWalletForm
          subAgents={subAgents.map((a) => ({ ...a, walletBalance: Number(a.walletBalance) }))}
        />
      </div>

      <TransactionsTable transactions={rows} currency={currency} />
    </div>
  );
}