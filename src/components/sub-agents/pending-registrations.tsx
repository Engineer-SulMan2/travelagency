"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { approveSubAgentRegistration, rejectSubAgentRegistration } from "@/lib/actions/sub-agents";

type PendingUser = { id: string; name: string; email: string };

export function PendingRegistrations({ users }: { users: PendingUser[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (users.length === 0) return null;

  async function handleApprove(id: string) {
    setBusyId(id);
    await approveSubAgentRegistration(id);
    setBusyId(null);
    router.refresh();
  }

  async function handleReject(id: string, name: string) {
    if (!confirm(`Reject ${name}'s registration request? This cannot be undone.`)) return;
    setBusyId(id);
    await rejectSubAgentRegistration(id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
          <UserPlus className="h-4 w-4 text-amber-700" />
        </span>
        <p className="text-sm font-semibold text-amber-900">
          {users.length} sub-agent{users.length > 1 ? "s" : ""} awaiting approval
        </p>
      </div>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-medium text-slate-900">{u.name}</p>
              <p className="text-xs text-slate-500">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApprove(u.id)}
                disabled={busyId === u.id}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() => handleReject(u.id, u.name)}
                disabled={busyId === u.id}
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