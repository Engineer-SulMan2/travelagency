"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Percent } from "lucide-react";
import { updateAgencyDefaultMarkup, type SubAgentFormState } from "@/lib/actions/sub-agents";

const initialState: SubAgentFormState = {};

export function AgencyMarkupForm({ currentPct }: { currentPct: number }) {
  const [state, formAction, pending] = useActionState(updateAgencyDefaultMarkup, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <Percent className="h-4 w-4 text-indigo-600" />
        </span>
        <p className="text-sm font-semibold text-slate-900">Agency default markup</p>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Used to pre-fill the markup % whenever you add a new sub-agent. Existing sub-agents keep their own rate.
      </p>

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Default markup %</label>
          <input
            name="defaultMarkupPct"
            type="number"
            step="0.1"
            min={0}
            max={100}
            defaultValue={currentPct}
            className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        {state.success && <span className="text-sm font-medium text-emerald-600">Saved</span>}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </form>
    </div>
  );
}