"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft } from "lucide-react";
import { requestPasswordReset, type ForgotPasswordState } from "@/lib/actions/password-reset";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
          {state.success ? (
            <div className="text-center">
              <h1 className="mb-1 text-xl font-semibold text-slate-900">Reset link ready</h1>
              <p className="mb-6 text-sm text-slate-500">
                No email service is configured in this demo, so here&apos;s your reset link directly:
              </p>
              {state.resetLink ? (
                <Link
                  href={state.resetLink}
                  className="block rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  Reset my password
                </Link>
              ) : (
                <p className="text-sm text-slate-500">
                  If an account exists for that email, a reset link has been generated.
                </p>
              )}
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-xl font-semibold text-slate-900">Forgot password?</h1>
              <p className="mb-6 text-sm text-slate-500">Enter your email and we&apos;ll get you a reset link.</p>

              <form action={formAction} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="you@agency.com"
                  />
                </div>

                {state.error && <p className="text-sm text-red-600">{state.error}</p>}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {pending ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          )}

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}