"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Target, Pencil } from "lucide-react";
import { setMyGoal, type GoalActionState } from "@/lib/actions/goals";
import { formatCurrency } from "@/lib/currency";

const initialState: GoalActionState = {};

export function GoalProgressCard({
  targetAmount,
  monthRevenue,
  currency,
}: {
  targetAmount: number | null;
  monthRevenue: number;
  currency: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(setMyGoal, initialState);
  const router = useRouter();
  const formatMoney = (n: number) => formatCurrency(n, currency);

  useEffect(() => {
    if (state.success) {
      setEditing(false);
      router.refresh();
    }
  }, [state.success, router]);

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

  if (!targetAmount || editing) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <Target className="h-4 w-4 text-emerald-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Monthly sales goal</p>
        </div>
        <form action={formAction} className="flex items-end gap-2">
          <input
            name="targetAmount"
            type="number"
            min={1}
            step="1000"
            required
            defaultValue={targetAmount ?? ""}
            placeholder="e.g. 500000"
            className={fieldClass}
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Set"}
          </button>
        </form>
        {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
      </div>
    );
  }

  const pct = Math.min(100, Math.round((monthRevenue / targetAmount) * 100));

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <Target className="h-4 w-4 text-emerald-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Monthly sales goal</p>
        </div>
        <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-slate-700" aria-label="Edit goal">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mb-2 text-xs text-slate-500">
        {formatMoney(monthRevenue)} of {formatMoney(targetAmount)} ({pct}%)
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {pct >= 100 && <p className="mt-2 text-xs font-medium text-emerald-600">Goal reached this month 🎉</p>}
    </div>
  );
}