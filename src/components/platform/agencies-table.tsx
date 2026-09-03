"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Ban, CheckCircle, Check, X, Clock } from "lucide-react";
import { toggleAgencyStatus, approveAgency, rejectAgency, type AgencyOverviewRow } from "@/lib/actions/platform";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export function AgenciesTable({ agencies }: { agencies: AgencyOverviewRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggle(id: string) {
    setBusyId(id);
    await toggleAgencyStatus(id);
    setBusyId(null);
    router.refresh();
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    await approveAgency(id);
    setBusyId(null);
    router.refresh();
  }

  async function handleReject(id: string, name: string) {
    if (!confirm(`Reject and remove ${name}'s registration? This deletes the agency and its admin account.`)) return;
    setBusyId(id);
    await rejectAgency(id);
    setBusyId(null);
    router.refresh();
  }

  if (agencies.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Building2 className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500">No agencies registered yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="pb-3 pr-4">Agency</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Sub-agents</th>
            <th className="pb-3 pr-4">Bookings</th>
            <th className="pb-3 pr-4">Revenue</th>
            <th className="pb-3 pr-4">Joined</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {agencies.map((a) => (
            <tr key={a.id} className="border-b border-slate-50 text-sm transition-colors last:border-0 hover:bg-slate-50/60">
              <td className="py-3.5 pr-4 font-medium text-slate-900">{a.name}</td>
              <td className="py-3.5 pr-4">
                {!a.approvedAt ? (
                  <span className="flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    <Clock className="h-3 w-3" /> Pending approval
                  </span>
                ) : (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      a.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    )}
                  >
                    {a.isActive ? "Active" : "Suspended"}
                  </span>
                )}
              </td>
              <td className="py-3.5 pr-4 text-slate-700">{a.subAgentCount}</td>
              <td className="py-3.5 pr-4 text-slate-700">{a.bookingCount}</td>
              <td className="py-3.5 pr-4 font-medium text-slate-900">{formatMoney(a.totalRevenue)}</td>
              <td className="py-3.5 pr-4 text-slate-500">{formatDate(a.createdAt)}</td>
              <td className="py-3.5">
                {!a.approvedAt ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(a.id)}
                      disabled={busyId === a.id}
                      className="flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(a.id, a.name)}
                      disabled={busyId === a.id}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleToggle(a.id)}
                    disabled={busyId === a.id}
                    className={cn(
                      "flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40",
                      a.isActive
                        ? "border-red-200 text-red-600 hover:bg-red-50"
                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    {a.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    {a.isActive ? "Suspend" : "Activate"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}