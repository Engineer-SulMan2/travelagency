"use client";

import { Plane, Clock, ArrowRight } from "lucide-react";
import type { FlightResult, FlightItinerary } from "@/types/flight";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short" });
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function tripTypeLabel(count: number) {
  if (count === 1) return "One Way";
  if (count === 2) return "Return";
  return "Multi-city";
}

function ItineraryRow({ itinerary, label }: { itinerary: FlightItinerary; label?: string }) {
  const first = itinerary.segments[0];
  const last = itinerary.segments[itinerary.segments.length - 1];
  const totalDuration = itinerary.segments.reduce((s, seg) => s + seg.durationMinutes, 0);

  return (
    <div className="flex items-center gap-3 border-b border-slate-50 py-2 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
        <Plane className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        {label && <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">{label}</p>}
        <p className="text-sm font-semibold text-slate-900">
          {first.airline} · {first.flightNumber}
          {itinerary.segments.length > 1 && ` +${itinerary.segments.length - 1} stop${itinerary.segments.length > 2 ? "s" : ""}`}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-600">
          <span>
            {formatDate(first.departureAt)} · {formatTime(first.departureAt)} {first.origin}
            <ArrowRight className="mx-1 inline h-3 w-3 text-slate-400" />
            {formatTime(last.arrivalAt)} {last.destination}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            {formatDuration(totalDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function FlightResultsList({
  results,
  markupPct,
  onSelect,
}: {
  results: FlightResult[];
  markupPct: number;
  onSelect: (flight: FlightResult) => void;
}) {
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No flights found for this route. Try different dates.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((flight) => {
        const sellingFare = Math.round(flight.netFare * (1 + markupPct / 100));
        const isMultiLeg = flight.itineraries.length > 1;

        return (
          <div key={flight.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                {tripTypeLabel(flight.itineraries.length)}
              </span>
              <div className="flex gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {flight.seatsLeft} seats left
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {flight.refundable ? "Refundable" : "Non-refundable"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                {flight.itineraries.map((it, i) => (
                  <ItineraryRow
                    key={i}
                    itinerary={it}
                    label={
                      isMultiLeg
                        ? flight.itineraries.length === 2
                          ? i === 0
                            ? "Outbound"
                            : "Return"
                          : `Leg ${i + 1}`
                        : undefined
                    }
                  />
                ))}
              </div>

              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900">{formatMoney(sellingFare)}</p>
                  <p className="text-xs text-slate-400">
                    Net {formatMoney(flight.netFare)} + {markupPct}% markup
                  </p>
                </div>
                <button
                  onClick={() => onSelect(flight)}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}