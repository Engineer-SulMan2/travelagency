"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { adjustWallet, type WalletActionState } from "@/lib/actions/wallet";

const initialState: WalletActionState = {};

export function AdjustWalletForm({
  subAgents,
}: {
  subAgents: { id: string; name: string; walletBalance: number }[];
}) {
  const [state, formAction, pending] = useActionState(adjustWallet, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  if (subAgents.length === 0) return null;

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <Settings2 className="h-4 w-4 text-indigo-600" />
        </span>
        <p className="text-sm font-semibold text-slate-900">Adjust a sub-agent&apos;s wallet</p>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        For manual settlements — e.g. crediting a sub-agent who paid you in cash.
      </p>

      <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <label className={labelClass}>Sub-agent</label>
          <select name="userId" required className={fieldClass}>
            {subAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (PKR {a.walletBalance.toLocaleString("en-PK")})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Direction</label>
          <select name="direction" className={fieldClass}>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Amount (PKR)</label>
          <input name="amount" type="number" min={1} required className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Note</label>
          <input name="note" required placeholder="Cash received" className={fieldClass} />
        </div>

        {state.error && <p className="text-sm text-red-600 sm:col-span-5">{state.error}</p>}

        <div className="sm:col-span-5">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Apply adjustment"}
          </button>
        </div>
      </form>
    </div>
  );
}