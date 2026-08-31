"use client";

import { useState } from "react";
import { ChevronLeft, UserRound, ArrowRight } from "lucide-react";
import { CustomerSearchSelect } from "@/components/customers/customer-search-select";
import { DatePicker } from "@/components/ui/date-picker";
import type { CustomerSummary } from "@/types/customer";
import type { PassengerDraft } from "@/stores/booking-store";

const TITLES: PassengerDraft["title"][] = ["Mr", "Mrs", "Ms"];
const TYPES: PassengerDraft["type"][] = ["ADULT", "CHILD", "INFANT"];

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export function PassengerForm({
  initialPassengers,
  onBack,
  onContinue,
}: {
  initialPassengers: PassengerDraft[];
  onBack: () => void;
  onContinue: (passengers: PassengerDraft[]) => void;
}) {
  const [passengers, setPassengers] = useState<PassengerDraft[]>(initialPassengers);
  const [selectedNames, setSelectedNames] = useState<(string | null)[]>(initialPassengers.map(() => null));
  const [error, setError] = useState<string | null>(null);

  function update(index: number, field: keyof PassengerDraft, value: string) {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  function selectCustomer(index: number, customer: CustomerSummary) {
    const { firstName, lastName } = splitName(customer.fullName);
    setPassengers((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, firstName, lastName, passportNumber: customer.passportNumber ?? p.passportNumber } : p
      )
    );
    setSelectedNames((prev) => prev.map((n, i) => (i === index ? customer.fullName : n)));
  }

  function clearSelection(index: number) {
    setSelectedNames((prev) => prev.map((n, i) => (i === index ? null : n)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = passengers.some((p) => !p.firstName.trim() || !p.lastName.trim());
    if (invalid) {
      setError("First and last name are required for every passenger.");
      return;
    }
    setError(null);
    onContinue(passengers);
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

      {passengers.map((p, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <UserRound className="h-4 w-4 text-indigo-600" />
            </span>
            <p className="text-sm font-semibold text-slate-900">Passenger {i + 1}</p>
          </div>

          <div className="mb-4">
            <label className={labelClass}>Fill from saved customer (optional)</label>
            <CustomerSearchSelect
              selectedLabel={selectedNames[i]}
              onSelect={(c) => selectCustomer(i, c)}
              onClear={() => clearSelection(i)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={p.type}
                onChange={(e) => update(i, "type", e.target.value)}
                className={fieldClass}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Title</label>
              <select
                value={p.title}
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
                value={p.firstName}
                onChange={(e) => update(i, "firstName", e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Last name</label>
              <input
                value={p.lastName}
                onChange={(e) => update(i, "lastName", e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Date of birth</label>
              <DatePicker
                value={p.dateOfBirth}
                onChange={(value) => update(i, "dateOfBirth", value)}
                max={new Date().toISOString().slice(0, 10)}
                placeholder="Select date"
              />
            </div>

            <div className="col-span-2 sm:col-span-3">
              <label className={labelClass}>Passport number</label>
              <input
                value={p.passportNumber}
                onChange={(e) => update(i, "passportNumber", e.target.value)}
                placeholder="Optional for domestic"
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