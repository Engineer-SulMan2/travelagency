"use client";

import { useState } from "react";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import type { FlightResult } from "@/types/flight";
import type { PassengerDraft } from "@/stores/booking-store";

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

export function BookingReview({
  flight,
  passengers,
  markupPct,
  onBack,
  onConfirm,
}: {
  flight: FlightResult;
  passengers: PassengerDraft[];
  markupPct: number;
  onBack: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markupAmount = Math.round(flight.netFare * (markupPct / 100));
  const sellingFare = flight.netFare + markupAmount;
  const total = sellingFare * passengers.length;
  const isMultiLeg = flight.itineraries.length > 1;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong creating the booking. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" /> Edit passengers
      </button>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-900">
          Flight{isMultiLeg && ` — ${flight.itineraries.length === 2 ? "Return" : "Multi-city"}`}
        </p>
        <div className="space-y-3">
          {flight.itineraries.map((it, i) => {
            const first = it.segments[0];
            const last = it.segments[it.segments.length - 1];
            return (
              <div key={i} className={i > 0 ? "border-t border-slate-100 pt-3" : ""}>
                {isMultiLeg && (
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-indigo-500">
                    {flight.itineraries.length === 2 ? (i === 0 ? "Outbound" : "Return") : `Leg ${i + 1}`}
                  </p>
                )}
                <p className="text-sm text-slate-700">
                  {first.airline} · {first.flightNumber} — {first.origin} → {last.destination}
                </p>
                <p className="text-xs text-slate-500">{new Date(first.departureAt).toLocaleString("en-PK")}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-900">Passengers</p>
        <ul className="space-y-1 text-sm text-slate-700">
          {passengers.map((p, i) => (
            <li key={i}>
              {p.title} {p.firstName} {p.lastName} <span className="text-slate-400">({p.type})</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-900">Fare breakdown</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Net fare (per passenger)</span>
            <span>{formatMoney(flight.netFare)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Your markup ({markupPct}%)</span>
            <span>{formatMoney(markupAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1.5 font-medium text-slate-900">
            <span>Selling fare (per passenger)</span>
            <span>{formatMoney(sellingFare)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Passengers</span>
            <span>× {passengers.length}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto sm:px-6"
      >
        <CheckCircle2 className="h-4 w-4" />
        {submitting ? "Confirming..." : "Confirm booking"}
      </button>
    </div>
  );
}