"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Trash2, Plus } from "lucide-react";
import {
  addCommissionTier,
  deleteCommissionTier,
  toggleCommissionTiers,
  type TierActionState,
} from "@/lib/actions/commission-tiers";

type Tier = { id: string; label: string; minRevenue: number; commissionPct: number };

const initialState: TierActionState = {};

export function CommissionTiersSection({
  tiers,
  enabled,
  currency,
}: {
  tiers: Tier[];
  enabled: boolean;
  currency: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(addCommissionTier, initialState);
  const [toggling, setToggling] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleToggle() {
    setToggling(true);
    await toggleCommissionTiers();
    setToggling(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this tier?")) return;
    setDeletingId(id);
    await deleteCommissionTier(id);
    setDeletingId(null);
    router.refresh();
  }

  const fieldClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

  const sortedTiers = [...tiers].sort((a, b) => a.minRevenue - b.minRevenue);

  return (
    <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Layers className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Commission tiers</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            disabled={toggling}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
          />
          Enabled
        </label>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        When enabled, a sub-agent&apos;s commission % is based on their sales so far this calendar month, instead
        of their fixed rate — the highest tier they&apos;ve reached applies.
      </p>

      {sortedTiers.length > 0 && (
        <div className="mb-4 space-y-2">
          {sortedTiers.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 text-sm"
            >
              <div>
                <span className="font-medium text-slate-900">{t.label}</span>
                <span className="ml-2 text-slate-500">
                  {currency} {t.minRevenue.toLocaleString("en-PK")}+ this month → {t.commissionPct}% commission
                </span>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={deletingId === t.id}
                className="rounded p-1 text-slate-300 hover:text-red-600 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input name="label" required placeholder="Gold" className={fieldClass} />
        <input
          name="minRevenue"
          type="number"
          min={0}
          step="1000"
          required
          placeholder="Min revenue (PKR)"
          className={fieldClass}
        />
        <input
          name="commissionPct"
          type="number"
          min={0}
          max={100}
          step="0.1"
          required
          placeholder="Commission %"
          className={fieldClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> {pending ? "Adding..." : "Add tier"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}