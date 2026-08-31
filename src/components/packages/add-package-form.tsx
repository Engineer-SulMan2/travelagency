"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Package as PackageIcon } from "lucide-react";
import { createPackage, type PackageFormState } from "@/lib/actions/packages";
import { DatePicker } from "@/components/ui/date-picker";

const initialState: PackageFormState = {};

export function AddPackageForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createPackage, initialState);
  const router = useRouter();
  const [validUntil, setValidUntil] = useState("");

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setValidUntil("");
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
        <Plus className="h-4 w-4" />
        Add package
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <PackageIcon className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">New package</p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="validUntil" value={validUntil} />

        <div>
          <label className={labelClass}>Title</label>
          <input name="title" required placeholder="5-Day Northern Pakistan Tour" className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Destination</label>
          <input name="destination" required placeholder="Hunza & Skardu" className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select name="category" defaultValue="HOLIDAY" className={fieldClass}>
            <option value="HOLIDAY">Holiday Package</option>
            <option value="TOUR">Tour Booking</option>
            <option value="UMRAH">Umrah Booking</option>
            <option value="GROUP">Group Booking</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Duration (days)</label>
          <input name="durationDays" type="number" min={1} max={60} required className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Base price (net, per traveler)</label>
          <input name="basePrice" type="number" min={0} step="100" required className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Max seats (optional)</label>
          <input
            name="maxSeats"
            type="number"
            min={1}
            placeholder="Leave blank for unlimited"
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Valid until (optional)</label>
          <DatePicker value={validUntil} onChange={setValidUntil} min={new Date().toISOString().slice(0, 10)} placeholder="No expiry" />
          <p className="mt-1.5 text-xs text-slate-400">After this date it stops showing in the sub-agent catalog.</p>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            required
            rows={3}
            placeholder="A scenic 5-day journey through the northern valleys..."
            className={fieldClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Inclusions (comma-separated)</label>
          <input
            name="inclusions"
            required
            placeholder="Return flights, 4-star hotel, Daily breakfast, Private transport"
            className={fieldClass}
          />
        </div>

        {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create package"}
          </button>
        </div>
      </form>
    </div>
  );
}