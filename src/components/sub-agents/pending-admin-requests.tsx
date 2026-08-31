"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { approveNewAgencyAdmin, rejectNewAgencyAdmin } from "@/lib/actions/admin-approvals";

type PendingAdmin = { id: string; name: string; email: string; agencyName: string };

export function PendingAdminRequests({ requests }: { requests: PendingAdmin[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (requests.length === 0) return null;

  async function handleApprove(id: string) {
    setBusyId(id);
    await approveNewAgencyAdmin(id);
    setBusyId(null);
    router.refresh();
  }

  async function handleReject(id: string, name: string) {
    if (!confirm(`Reject ${name}'s agency admin request? This deletes their account and the agency they were creating.`))
      return;
    setBusyId(id);
    await rejectNewAgencyAdmin(id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/50 p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
          <ShieldAlert className="h-4 w-4 text-rose-700" />
        </span>
        <p className="text-sm font-semibold text-rose-900">
          {requests.length} new agency admin request{requests.length > 1 ? "s" : ""} awaiting your approval
        </p>
      </div>
      <div className="space-y-2">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {r.name} <span className="font-normal text-slate-400">wants to create</span> {r.agencyName}
              </p>
              <p className="text-xs text-slate-500">{r.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApprove(r.id)}
                disabled={busyId === r.id}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() => handleReject(r.id, r.name)}
                disabled={busyId === r.id}
                className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}