"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, FileText, ShieldCheck, Coins, Receipt, ChevronDown, Hash, Sparkles } from "lucide-react";
import { updateAgencySettings, type AgencySettingsState } from "@/lib/actions/agency-settings";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const initialState: AgencySettingsState = {};

const TC_TEMPLATE = `1. Booking & Confirmation
A booking is only confirmed once full or partial payment has been received and a booking reference has been issued. Prices are subject to change until payment is confirmed.

2. Payments
All payments must be made in full by the due date specified at the time of booking. Failure to pay on time may result in automatic cancellation of the booking.

3. Cancellations & Refunds
Cancellation charges apply as per the policy for each product (see below). Refunds, where applicable, will be processed within 7–14 working days to the original payment method.

4. Amendments
Any changes to travel dates, names, or itineraries after confirmation may incur additional fees charged by the airline, hotel, or service provider, plus an administrative fee.

5. Travel Documents
Travellers are responsible for ensuring they hold valid passports, visas, and any other travel documents required for their journey. The agency is not liable for denied boarding or entry due to invalid documentation.

6. Liability
The agency acts as an intermediary between the traveller and airlines, hotels, and other service providers, and is not liable for delays, cancellations, or changes made by third-party suppliers.

7. Force Majeure
The agency is not responsible for failure to perform its obligations due to circumstances beyond its reasonable control, including but not limited to natural disasters, strikes, or government restrictions.`;

function CardHeader({ icon: Icon, title, tone = "indigo" }: { icon: React.ElementType; title: string; tone?: "indigo" | "emerald" | "slate" }) {
  const toneClass =
    tone === "emerald" ? "bg-emerald-50 text-emerald-600" : tone === "slate" ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-600";
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
    </div>
  );
}

export function AgencyInfoForm({
  businessHours,
  termsAndConditions,
  approvalThreshold,
  currency,
  taxId,
  flightCancellationPolicy,
  hotelCancellationPolicy,
  packageCancellationPolicy,
  visaCancellationPolicy,
}: {
  businessHours: string;
  termsAndConditions: string;
  approvalThreshold: number;
  currency: string;
  taxId: string;
  flightCancellationPolicy: string;
  hotelCancellationPolicy: string;
  packageCancellationPolicy: string;
  visaCancellationPolicy: string;
}) {
  const [state, formAction, pending] = useActionState(updateAgencySettings, initialState);
  const router = useRouter();
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const tcRef = useRef<HTMLTextAreaElement>(null);
  const [tcLength, setTcLength] = useState(termsAndConditions.length);

  function insertTemplate() {
    if (tcRef.current) {
      tcRef.current.value = TC_TEMPLATE;
      setTcLength(TC_TEMPLATE.length);
    }
  }

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  const currentCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency);

  return (
    <form action={formAction} className="space-y-4">
      {/* Business information */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <CardHeader icon={Clock} title="Business information" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Business hours</label>
            <input
              name="businessHours"
              defaultValue={businessHours}
              placeholder="Mon–Sat, 9:00 AM – 7:00 PM"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Tax ID / NTN</label>
            <input name="taxId" defaultValue={taxId} placeholder="Optional" className={fieldClass} />
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Hash className="h-3 w-3" /> Tax ID appears on printed invoices, next to your agency name.
        </p>
      </div>

      {/* Terms & conditions */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <CardHeader icon={FileText} title="Terms & conditions" />
          <button
            type="button"
            onClick={insertTemplate}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
          >
            <Sparkles className="h-3.5 w-3.5" /> Use professional template
          </button>
        </div>
        <textarea
          ref={tcRef}
          name="termsAndConditions"
          defaultValue={termsAndConditions}
          onChange={(e) => setTcLength(e.target.value.length)}
          rows={10}
          className={`${fieldClass} font-normal leading-relaxed`}
          placeholder="1. Booking & Confirmation&#10;A booking is only confirmed once payment has been received...&#10;&#10;2. Payments&#10;All payments must be made in full by the due date..."
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-400">Shown on printed invoices, below the itemized total.</p>
          <p className="text-xs text-slate-300">{tcLength.toLocaleString()} characters</p>
        </div>
      </div>

      {/* Display currency */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <CardHeader icon={Coins} title="Display currency" tone="emerald" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <select
            name="currency"
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className={`${fieldClass} sm:max-w-xs`}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          {currentCurrency && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm">
              <span className="font-semibold text-emerald-700">{currentCurrency.symbol}</span>
              <span className="text-emerald-600">amounts will show like this across the app</span>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          All amounts are still tracked internally in PKR — this only converts what&apos;s shown on screen, using
          fixed demo exchange rates (no live forex API is configured).
        </p>
      </div>

      {/* Cancellation policies */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={() => setPoliciesOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Receipt className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-slate-900">Per-product cancellation policies</p>
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${policiesOpen ? "rotate-180" : ""}`} />
        </button>
        <p className="mb-1 mt-2 text-xs text-slate-400">
          Informational text shown on invoices — doesn&apos;t change the actual refund amount when a booking is
          cancelled.
        </p>

        {policiesOpen && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Flight policy</label>
              <textarea
                name="flightCancellationPolicy"
                defaultValue={flightCancellationPolicy}
                rows={2}
                className={fieldClass}
                placeholder="e.g. Non-refundable within 48 hours of departure."
              />
            </div>
            <div>
              <label className={labelClass}>Hotel policy</label>
              <textarea
                name="hotelCancellationPolicy"
                defaultValue={hotelCancellationPolicy}
                rows={2}
                className={fieldClass}
                placeholder="e.g. Free cancellation up to 3 days before check-in."
              />
            </div>
            <div>
              <label className={labelClass}>Package policy</label>
              <textarea
                name="packageCancellationPolicy"
                defaultValue={packageCancellationPolicy}
                rows={2}
                className={fieldClass}
                placeholder="e.g. 50% refund up to 14 days before travel date."
              />
            </div>
            <div>
              <label className={labelClass}>Visa policy</label>
              <textarea
                name="visaCancellationPolicy"
                defaultValue={visaCancellationPolicy}
                rows={2}
                className={fieldClass}
                placeholder="e.g. Processing fees are non-refundable once submitted."
              />
            </div>
          </div>
        )}
      </div>

      {/* Booking approval threshold */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <CardHeader icon={ShieldCheck} title="Booking approval threshold" />
        <input
          name="approvalThreshold"
          type="number"
          step="1000"
          min={0}
          defaultValue={approvalThreshold}
          className={`${fieldClass} sm:max-w-xs`}
        />
        <p className="mt-3 text-xs text-slate-400">
          Bookings at or above this amount (in PKR) need your approval before they confirm. Set to 0 to disable —
          every booking confirms instantly.
        </p>
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm font-medium text-emerald-600">Saved</p>}
      </div>
    </form>
  );
}