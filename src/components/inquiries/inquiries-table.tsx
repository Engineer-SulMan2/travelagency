"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Trash2 } from "lucide-react";
import { updateInquiryStatus, deleteInquiry } from "@/lib/actions/inquiries";
import { cn } from "@/lib/utils";
import type { InquirySummary } from "@/types/inquiry";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-700",
  CONTACTED: "bg-sky-50 text-sky-700",
  CONVERTED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-500",
};

const PRODUCT_LABELS: Record<string, string> = {
  FLIGHT: "Flight",
  HOTEL: "Hotel",
  PACKAGE: "Package",
  VISA: "Visa",
};

export function InquiriesTable({ inquiries, showCreatedBy }: { inquiries: InquirySummary[]; showCreatedBy: boolean }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: string) {
    setBusyId(id);
    await updateInquiryStatus(id, status as "OPEN" | "CONTACTED" | "CONVERTED" | "CLOSED");
    setBusyId(null);
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove the inquiry from ${name}?`)) return;
    setBusyId(id);
    await deleteInquiry(id);
    setBusyId(null);
    router.refresh();
  }

  if (inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <ClipboardList className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500">No inquiries logged yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <table className="w-full min-w-[860px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="pb-3 pr-4">Customer</th>
            <th className="pb-3 pr-4">Interested in</th>
            <th className="pb-3 pr-4">Details</th>
            {showCreatedBy && <th className="pb-3 pr-4">Logged by</th>}
            <th className="pb-3 pr-4">Date</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inq) => (
            <tr key={inq.id} className="border-b border-slate-50 text-sm transition-colors last:border-0 hover:bg-slate-50/60">
              <td className="py-3.5 pr-4">
                <p className="font-medium text-slate-900">{inq.customerName}</p>
                <p className="text-xs text-slate-400">{inq.phone || inq.email || "—"}</p>
              </td>
              <td className="py-3.5 pr-4 text-slate-700">
                {inq.productType ? PRODUCT_LABELS[inq.productType] ?? inq.productType : "General"}
              </td>
              <td className="py-3.5 pr-4 max-w-xs text-slate-600">
                <p className="line-clamp-2">{inq.details}</p>
              </td>
              {showCreatedBy && <td className="py-3.5 pr-4 text-slate-700">{inq.createdBy}</td>}
              <td className="py-3.5 pr-4 text-slate-400">{formatDate(inq.createdAt)}</td>
              <td className="py-3.5 pr-4">
                <select
                  value={inq.status}
                  onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                  disabled={busyId === inq.id}
                  className={cn(
                    "rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none",
                    STATUS_STYLES[inq.status]
                  )}
                >
                  <option value="OPEN">Open</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </td>
              <td className="py-3.5">
                <button
                  onClick={() => handleDelete(inq.id, inq.customerName)}
                  disabled={busyId === inq.id}
                  className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}