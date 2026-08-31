"use client";

import { CheckCircle2 } from "lucide-react";

export function HotelBookingConfirmation({
  bookingRef,
  onNewSearch,
}: {
  bookingRef: string;
  onNewSearch: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      <h2 className="mt-4 text-lg font-semibold text-slate-900">Hotel booking confirmed</h2>
      <p className="mt-1 text-sm text-slate-500">Your booking reference is</p>
      <p className="mt-2 rounded-md bg-slate-100 px-4 py-2 font-mono text-lg font-semibold text-slate-900">
        {bookingRef}
      </p>
      <button
        onClick={onNewSearch}
        className="mt-6 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Search another hotel
      </button>
    </div>
  );
}
