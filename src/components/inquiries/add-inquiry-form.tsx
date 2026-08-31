"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, X } from "lucide-react";
import { createInquiry, type InquiryFormState } from "@/lib/actions/inquiries";

const initialState: InquiryFormState = {};

export function AddInquiryForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createInquiry, initialState);
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
        <ClipboardList className="h-4 w-4" />
        Log an inquiry
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">New inquiry</p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Customer name</label>
          <input name="customerName" required className={fieldClass} placeholder="Sana Malik" />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input name="phone" className={fieldClass} placeholder="03001234567" />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" className={fieldClass} placeholder="sana@example.com" />
        </div>
        <div>
          <label className={labelClass}>Interested in</label>
          <select name="productType" defaultValue="" className={fieldClass}>
            <option value="">General</option>
            <option value="FLIGHT">Flight</option>
            <option value="HOTEL">Hotel</option>
            <option value="PACKAGE">Package</option>
            <option value="VISA">Visa</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Details</label>
          <textarea
            name="details"
            required
            rows={3}
            className={fieldClass}
            placeholder="Wants a 5-night Umrah package for a family of 4 in December, budget around PKR 400,000..."
          />
        </div>

        {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save inquiry"}
          </button>
        </div>
      </form>
    </div>
  );
}