"use client";

import { useState } from "react";
import { ChevronLeft, BedDouble, ArrowRight } from "lucide-react";
import { CustomerSearchSelect } from "@/components/customers/customer-search-select";
import type { CustomerSummary } from "@/types/customer";
import type { GuestDraft } from "@/stores/hotel-booking-store";

const TITLES: GuestDraft["title"][] = ["Mr", "Mrs", "Ms"];

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export function GuestForm({
  initialGuests,
  onBack,
  onContinue,
}: {
  initialGuests: GuestDraft[];
  onBack: () => void;
  onContinue: (guests: GuestDraft[]) => void;
}) {
  const [guests, setGuests] = useState<GuestDraft[]>(initialGuests);
  const [selectedNames, setSelectedNames] = useState<(string | null)[]>(initialGuests.map(() => null));
  const [error, setError] = useState<string | null>(null);

  function update(index: number, field: keyof GuestDraft, value: string) {
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  }

  function selectCustomer(index: number, customer: CustomerSummary) {
    const { firstName, lastName } = splitName(customer.fullName);
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, firstName, lastName } : g)));
    setSelectedNames((prev) => prev.map((n, i) => (i === index ? customer.fullName : n)));
  }

  function clearSelection(index: number) {
    setSelectedNames((prev) => prev.map((n, i) => (i === index ? null : n)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (guests.some((g) => !g.firstName.trim() || !g.lastName.trim())) {
      setError("First and last name are required for every room's lead guest.");
      return;
    }
    setError(null);
    onContinue(guests);
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" /> Back to results
      </button>

      {guests.map((g, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <BedDouble className="h-4 w-4 text-indigo-600" />
            </span>
            <p className="text-sm font-semibold text-slate-900">Room {i + 1} — lead guest</p>
          </div>

          <div className="mb-4">
            <label className={labelClass}>Fill from saved customer (optional)</label>
            <CustomerSearchSelect
              selectedLabel={selectedNames[i]}
              onSelect={(c) => selectCustomer(i, c)}
              onClear={() => clearSelection(i)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <select
                value={g.title}
                onChange={(e) => update(i, "title", e.target.value)}
                className={fieldClass}
              >
                {TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>First name</label>
              <input
                value={g.firstName}
                onChange={(e) => update(i, "firstName", e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input
                value={g.lastName}
                onChange={(e) => update(i, "lastName", e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 sm:w-auto sm:px-6"
      >
        Continue to review
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}