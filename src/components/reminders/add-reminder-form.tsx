"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createReminder, type ReminderActionState } from "@/lib/actions/reminders";
import { CustomerSearchSelect } from "@/components/customers/customer-search-select";
import { DatePicker } from "@/components/ui/date-picker";

const initialState: ReminderActionState = {};

export function AddReminderForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createReminder, initialState);
  const router = useRouter();
  const [dueAt, setDueAt] = useState(new Date().toISOString().slice(0, 10));
  const [customerId, setCustomerId] = useState("");
  const [customerLabel, setCustomerLabel] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setCustomerId("");
      setCustomerLabel(null);
      router.refresh();
    }
  }, [state.success, router]);

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" /> Add reminder
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">New reminder</p>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="customerId" value={customerId} />

        <div>
          <label className={labelClass}>Link to a customer (optional)</label>
          <CustomerSearchSelect
            selectedLabel={customerLabel}
            onSelect={(c) => {
              setCustomerId(c.id);
              setCustomerLabel(c.fullName);
            }}
            onClear={() => {
              setCustomerId("");
              setCustomerLabel(null);
            }}
          />
        </div>

        <div>
          <label className={labelClass}>Note</label>
          <input name="note" required placeholder="Call back about the Umrah package" className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Due date</label>
          <input type="hidden" name="dueAt" value={dueAt} />
          <DatePicker value={dueAt} onChange={setDueAt} min={new Date().toISOString().slice(0, 10)} />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add reminder"}
        </button>
      </form>
    </div>
  );
}