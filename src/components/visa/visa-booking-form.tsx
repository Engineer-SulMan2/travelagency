"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Stamp, Globe2, Receipt, ArrowRight } from "lucide-react";
import { createVisaBooking, type VisaBookingState } from "@/lib/actions/create-visa-booking";
import { getVisaNetFee, VISA_COUNTRIES, VISA_TYPES, type VisaType } from "@/lib/visa-fees";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomerSearchSelect } from "@/components/customers/customer-search-select";
import type { CustomerSummary } from "@/types/customer";

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function defaultTravelDate() {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return d.toISOString().slice(0, 10);
}

const initialState: VisaBookingState = {};

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <Icon className="h-4 w-4 text-indigo-600" />
        </span>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
      </div>
      {children}
    </div>
  );
}

export function VisaBookingForm({ markupPct }: { markupPct: number }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createVisaBooking, initialState);

  const [country, setCountry] = useState<(typeof VISA_COUNTRIES)[number]>(VISA_COUNTRIES[0]);
  const [visaType, setVisaType] = useState<VisaType>("TOURIST");
  const [applicants, setApplicants] = useState(1);
  const [travelDate, setTravelDate] = useState(defaultTravelDate());
  const [leadApplicantName, setLeadApplicantName] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const netFare = useMemo(() => getVisaNetFee(country, visaType), [country, visaType]);
  const sellingFare = Math.round(netFare * (1 + markupPct / 100));
  const total = sellingFare * applicants;

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  if (state.success) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
          <Stamp className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Visa booking confirmed</h2>
        <p className="mt-1 text-sm text-slate-500">Your booking reference is</p>
        <p className="mt-3 rounded-xl bg-indigo-50 px-5 py-2.5 font-mono text-lg font-semibold text-indigo-700">
          {state.bookingRef}
        </p>
        <button
          onClick={() => router.refresh()}
          className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
        >
          Book another visa
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="travelDate" value={travelDate} />
      <input type="hidden" name="leadApplicantName" value={leadApplicantName} />
      <input type="hidden" name="passportNumber" value={passportNumber} />

      <SectionCard icon={Globe2} title="Visa details">
        <div className="mb-4">
          <label className={labelClass}>Fill from saved customer (optional)</label>
          <CustomerSearchSelect
            selectedLabel={selectedCustomer}
            onSelect={(c) => {
              setLeadApplicantName(c.fullName);
              setPassportNumber(c.passportNumber ?? "");
              setSelectedCustomer(c.fullName);
            }}
            onClear={() => setSelectedCustomer(null)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Destination country</label>
            <select
              name="destinationCountry"
              value={country}
              onChange={(e) => setCountry(e.target.value as (typeof VISA_COUNTRIES)[number])}
              className={fieldClass}
            >
              {VISA_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Visa type</label>
            <select
              name="visaType"
              value={visaType}
              onChange={(e) => setVisaType(e.target.value as VisaType)}
              className={fieldClass}
            >
              {VISA_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Applicants</label>
            <input
              name="applicants"
              type="number"
              min={1}
              max={20}
              value={applicants}
              onChange={(e) => setApplicants(Math.min(20, Math.max(1, Number(e.target.value))))}
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Intended travel date</label>
            <DatePicker
              value={travelDate}
              onChange={setTravelDate}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div>
            <label className={labelClass}>Lead applicant name</label>
            <input
              value={leadApplicantName}
              onChange={(e) => setLeadApplicantName(e.target.value)}
              required
              placeholder="Full name"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Passport number</label>
            <input
              value={passportNumber}
              onChange={(e) => setPassportNumber(e.target.value)}
              required
              className={fieldClass}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Receipt} title="Fee breakdown">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Net processing fee (per applicant)</span>
            <span>{formatMoney(netFare)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Your markup ({markupPct}%)</span>
            <span>{formatMoney(sellingFare - netFare)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-medium text-slate-900">
            <span>Selling fee (per applicant)</span>
            <span>{formatMoney(sellingFare)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Applicants</span>
            <span>× {applicants}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-indigo-50 px-3 py-2.5 text-base font-semibold text-indigo-700">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </SectionCard>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50 sm:w-auto sm:px-6"
      >
        {pending ? (
          "Booking..."
        ) : (
          <>
            Confirm visa booking <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}