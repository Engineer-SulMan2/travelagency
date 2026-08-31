import { formatCurrency } from "@/lib/currency";

type Row = {
  id: string;
  name: string;
  markupPct: number;
  commissionPct: number;
  bookingCount: number;
  totalMarkup: number;
  totalCommission: number;
  totalAgencyShare: number;
};

export function CommissionBreakdownTable({ rows, currency = "PKR" }: { rows: Row[]; currency?: string }) {
  const formatMoney = (n: number) => formatCurrency(n, currency);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No commission activity yet — it shows up here once sub-agents start booking.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <table className="w-full min-w-[680px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="pb-2 pr-4">Sub-agent</th>
            <th className="pb-2 pr-4">Rate</th>
            <th className="pb-2 pr-4">Bookings</th>
            <th className="pb-2 pr-4">Total markup</th>
            <th className="pb-2 pr-4">Sub-agent commission</th>
            <th className="pb-2">Agency share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 text-sm last:border-0">
              <td className="py-3 pr-4 font-medium text-slate-900">{r.name}</td>
              <td className="py-3 pr-4 text-slate-600">
                {r.markupPct}% markup / {r.commissionPct}% comm.
              </td>
              <td className="py-3 pr-4 text-slate-700">{r.bookingCount}</td>
              <td className="py-3 pr-4 text-slate-700">{formatMoney(r.totalMarkup)}</td>
              <td className="py-3 pr-4 text-slate-700">{formatMoney(r.totalCommission)}</td>
              <td className="py-3 text-slate-700">{formatMoney(r.totalAgencyShare)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}