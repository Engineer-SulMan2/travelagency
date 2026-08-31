"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ClipboardCheck } from "lucide-react";
import { approveBooking, rejectBooking } from "@/lib/actions/booking-approval";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import type { BookingSummary, ProductType } from "@/types/booking-summary";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE_LABELS: Record<ProductType, string> = {
  FLIGHT: "Flight",
  HOTEL: "Hotel",
  PACKAGE: "Package",
  VISA: "Visa",
};

const TYPE_STYLES: Record<ProductType, string> = {
  FLIGHT: "bg-sky-50 text-sky-700",
  HOTEL: "bg-violet-50 text-violet-700",
  PACKAGE: "bg-amber-50 text-amber-700",
  VISA: "bg-rose-50 text-rose-700",
};

export function ApprovalsTable({ bookings, currency = "PKR" }: { bookings: BookingSummary[]; currency?: string }) {
  const formatMoney = (n: number) => formatCurrency(n, currency);
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleApprove(b: BookingSummary) {
    setBusyId(b.id);
    await approveBooking(b.type, b.id);
    setBusyId(null);
    router.refresh();
  }

  async function handleReject(b: BookingSummary) {
    if (!confirm(`Reject booking ${b.bookingRef}? Its net cost will be refunded to the sub-agent.`)) return;
    setBusyId(b.id);
    await rejectBooking(b.type, b.id);
    setBusyId(null);
    router.refresh();
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <ClipboardCheck className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500">No bookings waiting for approval.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="pb-3 pr-4">Reference</th>
            <th className="pb-3 pr-4">Type</th>
            <th className="pb-3 pr-4">Details</th>
            <th className="pb-3 pr-4">Booked by</th>
            <th className="pb-3 pr-4">Date</th>
            <th className="pb-3 pr-4">Amount</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={`${b.type}-${b.id}`} className="border-b border-slate-50 text-sm transition-colors last:border-0 hover:bg-slate-50/60">
              <td className="py-3.5 pr-4 font-mono text-xs font-medium text-slate-900">{b.bookingRef}</td>
              <td className="py-3.5 pr-4">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", TYPE_STYLES[b.type])}>
                  {TYPE_LABELS[b.type]}
                </span>
              </td>
              <td className="py-3.5 pr-4">
                <p className="text-slate-900">{b.title}</p>
                <p className="text-xs text-slate-400">{b.subtitle}</p>
              </td>
              <td className="py-3.5 pr-4 text-slate-700">{b.bookedBy}</td>
              <td className="py-3.5 pr-4 text-slate-500">{formatDate(b.createdAt)}</td>
              <td className="py-3.5 pr-4 font-medium text-slate-900">{formatMoney(b.totalAmount)}</td>
              <td className="py-3.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(b)}
                    disabled={busyId === b.id}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(b)}
                    disabled={busyId === b.id}
                    className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}