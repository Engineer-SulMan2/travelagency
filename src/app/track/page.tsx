"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PlaneTakeoff, Search, XCircle } from "lucide-react";
import { lookupBookingStatus, type TrackResult } from "@/lib/actions/track-booking";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-50 text-red-700",
};

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

export default function TrackBookingPage() {
  const searchParams = useSearchParams();
  const [bookingRef, setBookingRef] = useState(searchParams.get("ref")?.toUpperCase() ?? "");
  const [lastName, setLastName] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await lookupBookingStatus(bookingRef, lastName);
    setResult(res);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
            <PlaneTakeoff className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Track your booking</h1>
          <p className="mb-6 text-sm text-slate-500">Enter your booking reference and last name to check status.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Booking reference</label>
              <input
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                required
                placeholder="TRV-9F3K2A"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm uppercase outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Last name (or lead traveler name)
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Khan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {loading ? "Searching..." : "Check status"}
            </button>
          </form>

          {searched && (
            <div className="mt-6">
              {result?.found ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  {result.agencyLogoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.agencyLogoUrl} alt="" className="mb-3 h-8 w-8 rounded-lg object-cover" />
                  )}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-slate-500">{result.bookingRef}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[result.status ?? ""] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {result.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{result.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{result.subtitle}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-xs text-slate-400">{result.agencyName}</span>
                    <span className="text-sm font-semibold text-indigo-700">{formatMoney(result.totalAmount ?? 0)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <XCircle className="h-4 w-4 shrink-0" />
                  No booking found matching those details. Double-check your reference and name.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}