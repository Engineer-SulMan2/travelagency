"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { topUpWallet, type WalletActionState } from "@/lib/actions/wallet";
import { cn } from "@/lib/utils";

const initialState: WalletActionState = {};

const METHODS = [
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "JAZZCASH", label: "JazzCash", icon: Smartphone },
  { value: "EASYPAISA", label: "EasyPaisa", icon: Wallet },
] as const;

export function TopUpForm({ isLive = false }: { isLive?: boolean }) {
  const [state, formAction, pending] = useActionState(topUpWallet, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.redirectUrl) {
      window.location.href = state.redirectUrl;
      return;
    }
    if (state.success) router.refresh();
  }, [state.success, state.redirectUrl, router]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-slate-900">Top up wallet</p>
      <p className="mb-4 text-xs text-slate-500">
        {isLive
          ? "You'll be redirected to a secure payment page to complete your top-up."
          : "Simulated payment gateway — no real charge is made."}
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Amount (PKR)</label>
          <input
            name="amount"
            type="number"
            min={500}
            step="100"
            required
            defaultValue={10000}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>

        {!isLive && (
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">Payment method</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <label
                  key={m.value}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1 rounded-md border border-slate-300 px-3 py-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50",
                    "has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white"
                  )}
                >
                  <input type="radio" name="method" value={m.value} defaultChecked={m.value === "CARD"} className="sr-only" />
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm text-emerald-600">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {pending ? (isLive ? "Redirecting to payment page..." : "Processing payment...") : "Top up"}
        </button>
      </form>
    </div>
  );
}