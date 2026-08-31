"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, Users } from "lucide-react";
import { toggleSubAgentStatus } from "@/lib/actions/sub-agents";
import { cn } from "@/lib/utils";

type Row = { id: string; name: string; email: string; status: string; agencyName: string };

export function PlatformSubAgentsTable({ agents }: { agents: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggle(id: string) {
    setBusyId(id);
    await toggleSubAgentStatus(id);
    setBusyId(null);
    router.refresh();
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Users className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500">No sub-agents on the platform yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <table className="w-full min-w-[680px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="pb-3 pr-4">Sub-agent</th>
            <th className="pb-3 pr-4">Agency</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.id} className="border-b border-slate-50 text-sm transition-colors last:border-0 hover:bg-slate-50/60">
              <td className="py-3.5 pr-4">
                <p className="font-medium text-slate-900">{a.name}</p>
                <p className="text-xs text-slate-400">{a.email}</p>
              </td>
              <td className="py-3.5 pr-4 text-slate-700">{a.agencyName}</td>
              <td className="py-3.5 pr-4">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    a.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  )}
                >
                  {a.status}
                </span>
              </td>
              <td className="py-3.5">
                <button
                  onClick={() => handleToggle(a.id)}
                  disabled={busyId === a.id}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40",
                    a.status === "ACTIVE"
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  )}
                >
                  {a.status === "ACTIVE" ? (
                    <>
                      <Ban className="h-3.5 w-3.5" /> Suspend
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" /> Activate
                    </>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}