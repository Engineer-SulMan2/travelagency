"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlaneTakeoff, User, Mail, Lock, Building2, CheckCircle2 } from "lucide-react";
import { registerSubAgent, type RegisterSubAgentState } from "@/lib/actions/register-sub-agent";

const initialState: RegisterSubAgentState = {};

export function RegisterAgentForm({ agencies }: { agencies: { id: string; name: string }[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerSubAgent, initialState);

  useEffect(() => {
    // No auto-redirect — the person needs to see the "awaiting approval" message.
  }, [state.success]);

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-600";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
            <PlaneTakeoff className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
          {state.success ? (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="mt-4 text-lg font-semibold text-slate-900">Request sent</h1>
              <p className="mt-1 text-sm text-slate-500">
                Your agency admin has been notified. You&apos;ll be able to sign in once your account is approved.
              </p>
              <Link
                href="/login"
                className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-xl font-semibold text-slate-900">Join an agency</h1>
              <p className="mb-6 text-sm text-slate-500">Sign up as a sub-agent — your admin approves before you can sign in</p>

              <form action={formAction} className="space-y-4">
                <div>
                  <label className={labelClass}>Agency</label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select name="agencyId" required className={fieldClass} defaultValue="">
                      <option value="" disabled>
                        Select an agency
                      </option>
                      {agencies.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Your name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input name="name" required className={fieldClass} placeholder="Ali Khan" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input name="email" type="email" required className={fieldClass} placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      className={fieldClass}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {state.error && <p className="text-sm text-red-600">{state.error}</p>}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {pending ? "Sending request..." : "Request to join"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Setting up a new agency instead?{" "}
                <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
                  Create an agency
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}