"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { createSubAgent, type SubAgentFormState } from "@/lib/actions/sub-agents";

const initialState: SubAgentFormState = {};

export function AddSubAgentForm({ defaultMarkupPct }: { defaultMarkupPct: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createSubAgent, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
      >
        <UserPlus className="h-4 w-4" />
        Add sub-agent
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <UserPlus className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">New sub-agent</p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input name="name" required className={fieldClass} placeholder="Ali Khan" />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" required className={fieldClass} placeholder="ali@agency.com" />
        </div>

        <div>
          <label className={labelClass}>Temporary password</label>
          <input
            name="password"
            type="text"
            required
            minLength={6}
            className={fieldClass}
            placeholder="Min 6 characters"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Markup %</label>
            <input
              name="markupPct"
              type="number"
              step="0.1"
              min={0}
              max={100}
              defaultValue={defaultMarkupPct}
              required
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Commission %</label>
            <input
              name="commissionPct"
              type="number"
              step="0.1"
              min={0}
              max={100}
              defaultValue={70}
              required
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Credit limit</label>
            <input
              name="creditLimit"
              type="number"
              step="1000"
              min={0}
              defaultValue={0}
              className={fieldClass}
            />
          </div>
        </div>

        {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create sub-agent"}
          </button>
        </div>
      </form>
    </div>
  );
}