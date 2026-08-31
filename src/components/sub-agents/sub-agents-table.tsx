import { Users } from "lucide-react";
import type { SubAgentRow } from "@/types/sub-agent";
import { SubAgentRowItem } from "./sub-agent-row";

export function SubAgentsTable({ agents, currency = "PKR" }: { agents: SubAgentRow[]; currency?: string }) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Users className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500">No sub-agents yet. Add your first one above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <table className="w-full min-w-[820px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="pb-3 pr-4">Sub-agent</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Markup %</th>
            <th className="pb-3 pr-4">Commission %</th>
            <th className="pb-3 pr-4">Credit limit</th>
            <th className="pb-3 pr-4">Bookings</th>
            <th className="pb-3 pr-4">Commission earned</th>
            <th className="pb-3 pr-4">Wallet</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <SubAgentRowItem key={agent.id} agent={agent} currency={currency} />
          ))}
        </tbody>
      </table>
    </div>
  );
}