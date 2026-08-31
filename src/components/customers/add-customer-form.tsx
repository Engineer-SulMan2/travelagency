"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { createCustomer, type CustomerFormState } from "@/lib/actions/customers";

const initialState: CustomerFormState = {};

export function AddCustomerForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createCustomer, initialState);
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
        Add customer
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
          <p className="text-sm font-semibold text-slate-900">New customer</p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Full name</label>
          <input name="fullName" required className={fieldClass} placeholder="Ahmed Raza" />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input name="phone" className={fieldClass} placeholder="03001234567" />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" className={fieldClass} placeholder="ahmed@example.com" />
        </div>
        <div>
          <label className={labelClass}>Passport number</label>
          <input name="passportNumber" className={fieldClass} placeholder="Optional" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea name="notes" rows={2} className={fieldClass} placeholder="Preferences, family members, etc." />
        </div>

        {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save customer"}
          </button>
        </div>
      </form>
    </div>
  );
}