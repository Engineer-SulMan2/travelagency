"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createQuote, type QuoteActionState } from "@/lib/actions/quotes";

const initialState: QuoteActionState = {};

export function AddQuoteForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createQuote, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" /> New quote
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">New quote</p>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Customer name</label>
            <input name="customerName" required placeholder="Ali Khan" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Contact (phone/email)</label>
            <input name="customerContact" placeholder="Optional" className={fieldClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Title</label>
          <input name="title" required placeholder="7-day Umrah package for 2" className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Details</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Flights + hotel + visa, includes breakfast..."
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Quoted amount (PKR)</label>
          <input name="amount" type="number" min={1} step="100" required className={fieldClass} />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create quote"}
        </button>
      </form>
    </div>
  );
}