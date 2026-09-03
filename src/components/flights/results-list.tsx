"use client";

import { Plane, Clock } from "lucide-react";
import type { FlightResult, FlightItinerary } from "@/types/flight";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: false });
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

// Days the arrival lands after departure (e.g. an overnight flight) shown
// as a small "+1" superscript next to the arrival time, matching how most
// booking sites flag overnight connections.
function dayOffset(departureIso: string, arrivalIso: string) {
  const dep = new Date(departureIso);
  const arr = new Date(arrivalIso);
  const depDay = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate());
  const arrDay = new Date(arr.getFullYear(), arr.getMonth(), arr.getDate());
  return Math.round((arrDay.getTime() - depDay.getTime()) / 86400000);
}

function ItineraryRow({ itinerary, label }: { itinerary: FlightItinerary; label?: string }) {
  const first = itinerary.segments[0];
  const last = itinerary.segments[itinerary.segments.length - 1];
  const totalDuration = itinerary.segments.reduce((s, seg) => s + seg.durationMinutes, 0);
  const stops = itinerary.segments.length - 1;
  const offset = dayOffset(first.departureAt, last.arrivalAt);

  return (
    <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-0">
           <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
        {first.airlineLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={first.airlineLogoUrl} alt={first.airline} className="h-6 w-6 object-contain" />
        ) : (
          <Plane className="h-4 w-4 text-slate-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {label && <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-indigo-500">{label}</p>}
        <p className="text-lg font-bold tracking-tight text-slate-900">
          {formatTime(first.departureAt)} – {formatTime(last.arrivalAt)}
          {offset > 0 && <sup className="ml-0.5 text-xs font-semibold text-slate-500">+{offset}</sup>}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">
          {first.airline} · {first.flightNumber}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {formatDate(first.departureAt)} · {first.origin} – {last.destination}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="flex items-center justify-end gap-1 text-sm font-semibold text-slate-900">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {formatDuration(totalDuration)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`}</p>
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
    <div className="space-y-4">
      {results.map((flight) => {
        const sellingFare = Math.round(flight.netFare * (1 + markupPct / 100));
        const isMultiLeg = flight.itineraries.length > 1;

        return (
          <div key={flight.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2.5">
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

            <div className="px-5">
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

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <div>
                <p className="text-xs text-slate-400">
                  From <span className="text-slate-500">Net {formatMoney(flight.netFare)} + {markupPct}%</span>
                </p>
                <p className="text-xl font-bold text-slate-900">{formatMoney(sellingFare)}</p>
              </div>
              <button
                onClick={() => onSelect(flight)}
                className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Select
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}