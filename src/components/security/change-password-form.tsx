"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { changePassword, type ChangePasswordState } from "@/lib/actions/change-password";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const [showPasswords, setShowPasswords] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";
  const inputType = showPasswords ? "text" : "password";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <KeyRound className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Change password</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswords((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showPasswords ? "Hide" : "Show"}
        </button>
      </div>

      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <label className={labelClass}>Current password</label>
          <input type={inputType} name="currentPassword" required className={fieldClass} autoComplete="current-password" />
        </div>

        <div>
          <label className={labelClass}>New password</label>
          <input type={inputType} name="newPassword" required minLength={6} className={fieldClass} autoComplete="new-password" />
          <p className="mt-1 text-xs text-slate-400">At least 6 characters.</p>
        </div>

        <div>
          <label className={labelClass}>Confirm new password</label>
          <input type={inputType} name="confirmPassword" required minLength={6} className={fieldClass} autoComplete="new-password" />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm font-medium text-emerald-600">Password updated.</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}