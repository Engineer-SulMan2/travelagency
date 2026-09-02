"use client";

import { useActionState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { resetPassword, type ResetPasswordState } from "@/lib/actions/password-reset";

const initialState: ResetPasswordState = {};

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => router.push("/login"), 2000);
      return () => clearTimeout(t);
    }
  }, [state.success, router]);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
        {state.success ? (
          <div className="text-center">
            <h1 className="mb-1 text-xl font-semibold text-slate-900">Password updated</h1>
            <p className="text-sm text-slate-500">Redirecting you to sign in...</p>
          </div>
        ) : !token ? (
          <div className="text-center">
            <h1 className="mb-1 text-xl font-semibold text-slate-900">Invalid link</h1>
            <p className="mb-6 text-sm text-slate-500">This reset link is missing its token.</p>
            <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Request a new link
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-xl font-semibold text-slate-900">Set a new password</h1>
            <p className="mb-6 text-sm text-slate-500">Choose a new password for your account.</p>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="token" value={token} />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">New password</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="••••••••"
                />
              </div>

              {state.error && <p className="text-sm text-red-600">{state.error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {pending ? "Updating..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}