import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

export type WalletTransactionRow = {
  id: string;
  type: "CREDIT" | "DEBIT";
  reason: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

const REASON_LABELS: Record<string, string> = {
  TOPUP: "Top-up",
  BOOKING_PAYMENT: "Booking payment",
  COMMISSION_EARNED: "Commission earned",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

export function TransactionsTable({
  transactions,
  currency = "PKR",
}: {
  transactions: WalletTransactionRow[];
  currency?: string;
}) {
  const formatMoney = (n: number) => formatCurrency(n, currency);

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No wallet activity yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="pb-2 pr-4">Date</th>
            <th className="pb-2 pr-4">Reason</th>
            <th className="pb-2 pr-4">Description</th>
            <th className="pb-2 pr-4">Amount</th>
            <th className="pb-2">Balance after</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-slate-100 text-sm last:border-0">
              <td className="py-3 pr-4 text-slate-500">
                {new Date(t.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
              </td>
              <td className="py-3 pr-4 text-slate-700">{REASON_LABELS[t.reason] ?? t.reason}</td>
              <td className="py-3 pr-4 text-slate-500">{t.description ?? "—"}</td>
              <td
                className={cn(
                  "py-3 pr-4 font-medium",
                  t.type === "CREDIT" ? "text-emerald-600" : "text-red-600"
                )}
              >
                {t.type === "CREDIT" ? "+" : "−"}
                {formatMoney(t.amount)}
              </td>
              <td className="py-3 text-slate-700">{formatMoney(t.balanceAfter)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}