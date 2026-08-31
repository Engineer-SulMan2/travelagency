"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PlaneTakeoff, Building2, User, Mail, Lock } from "lucide-react";
import { registerAgency, type RegisterState } from "@/lib/actions/register";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerAgency, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/login");
    }
  }, [state.success, router]);

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
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Create your agency</h1>
          <p className="mb-6 text-sm text-slate-500">Sets you up as the Agency Admin</p>

          <form action={formAction} className="space-y-4">
            <div>
              <label className={labelClass}>Agency name</label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input name="agencyName" required className={fieldClass} placeholder="Skyway Travels" />
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
                <input name="email" type="email" required className={fieldClass} placeholder="you@agency.com" />
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
              {pending ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-500">
            Joining an existing agency?{" "}
            <Link href="/register-agent" className="font-medium text-indigo-600 hover:text-indigo-700">
              Sign up as a sub-agent
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}