import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export type WalletTransactionRow = {
  id: string;
  type: "CREDIT" | "DEBIT";
  reason: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

const REASON_LABELS: Record<string, string> = {
  TOPUP: "Top-up",
  BOOKING_PAYMENT: "Booking payment",
  COMMISSION_EARNED: "Commission earned",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

export function TransactionsTable({ transactions }: { transactions: WalletTransactionRow[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Receipt className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500">No wallet activity yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="pb-3 pr-4">Date</th>
            <th className="pb-3 pr-4">Reason</th>
            <th className="pb-3 pr-4">Description</th>
            <th className="pb-3 pr-4">Amount</th>
            <th className="pb-3">Balance after</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-slate-50 text-sm transition-colors last:border-0 hover:bg-slate-50/60">
              <td className="py-3.5 pr-4 text-slate-500">
                {new Date(t.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
              </td>
              <td className="py-3.5 pr-4">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    t.type === "CREDIT" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {REASON_LABELS[t.reason] ?? t.reason}
                </span>
              </td>
              <td className="py-3.5 pr-4 text-slate-500">{t.description ?? "—"}</td>
              <td
                className={cn(
                  "py-3.5 pr-4 font-semibold",
                  t.type === "CREDIT" ? "text-emerald-600" : "text-red-600"
                )}
              >
                {t.type === "CREDIT" ? "+" : "−"}
                {formatMoney(t.amount)}
              </td>
              <td className="py-3.5 font-medium text-slate-900">{formatMoney(t.balanceAfter)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}