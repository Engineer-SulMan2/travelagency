"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet as WalletIcon } from "lucide-react";
import { createPayoutBatch, type PayoutState } from "@/lib/actions/payouts";
import { DatePicker } from "@/components/ui/date-picker";

const initialState: PayoutState = {};

function defaultPeriodStart() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}
function defaultPeriodEnd() {
  return new Date().toISOString().slice(0, 10);
}

export function CreatePayoutForm() {
  const [state, formAction, pending] = useActionState(createPayoutBatch, initialState);
  const router = useRouter();
  const [periodStart, setPeriodStart] = useState(defaultPeriodStart());
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodEnd());

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <WalletIcon className="h-4 w-4 text-indigo-600" />
        </span>
        <p className="text-sm font-semibold text-slate-900">New payout batch</p>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Settles all commission earned by every sub-agent in this period — debits it from their wallet, as if paid
        out for real via bank transfer.
      </p>

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="periodStart" value={periodStart} />
        <input type="hidden" name="periodEnd" value={periodEnd} />

        <div className="w-40">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Period start</label>
          <DatePicker value={periodStart} onChange={setPeriodStart} max={periodEnd} />
        </div>
        <div className="w-40">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Period end</label>
          <DatePicker value={periodEnd} onChange={setPeriodEnd} min={periodStart} max={new Date().toISOString().slice(0, 10)} />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create payout batch"}
        </button>

        {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="w-full text-sm font-medium text-emerald-600">Payout batch created</p>}
      </form>
    </div>
  );
}