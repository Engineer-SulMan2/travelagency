"use client";

import { useMemo } from "react";
import { PlaneTakeoff, PlaneLanding, ArrowRight, Pencil } from "lucide-react";
import type { FlightResult, FlightSearchParams } from "@/types/flight";

export type SortOption = "cheapest" | "expensive" | "shortest" | "longest";
export type StopsOption = "direct" | "1" | "2" | "any";

export type FlightFilters = {
  sortBy: SortOption;
  stops: StopsOption;
  airline: string; // "" = all
  flightNumber: string;
  takeoffRange: [number, number]; // minutes since midnight, 0–1439
  landingRange: [number, number];
};

export const DEFAULT_FILTERS: FlightFilters = {
  sortBy: "cheapest",
  stops: "any",
  airline: "",
  flightNumber: "",
  takeoffRange: [0, 1439],
  landingRange: [0, 1439],
};

function minutesToClock(mins: number) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function tripTypeLabel(tripType: FlightSearchParams["tripType"]) {
  if (tripType === "ROUND_TRIP") return "Return";
  if (tripType === "MULTI_CITY") return "Multi-city";
  return "One way";
}

export function FlightFiltersSidebar({
  searchParams,
  results,
  filters,
  onChange,
  onEditSearch,
}: {
  searchParams: FlightSearchParams | null;
  results: FlightResult[];
  filters: FlightFilters;
  onChange: (filters: FlightFilters) => void;
  onEditSearch: () => void;
}) {
  const airlines = useMemo(() => {
    const set = new Map<string, string>();
    results.forEach((r) =>
      r.itineraries.forEach((it) => it.segments.forEach((s) => set.set(s.airlineCode, s.airline)))
    );
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [results]);

  function update<K extends keyof FlightFilters>(key: K, value: FlightFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  const firstLeg = searchParams?.legs[0];
  const lastLeg = searchParams?.legs[searchParams.legs.length - 1];

  const radioClass = "h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-400";
  const labelClass = "flex items-center gap-2 py-1 text-sm text-slate-700";

  return (
    <div className="space-y-5">
      {searchParams && firstLeg && (
        <div className="rounded-2xl border border-slate-100 bg-indigo-50/40 p-5">
          <p className="text-base font-bold text-slate-900">
            {tripTypeLabel(searchParams.tripType)} trip to {lastLeg?.destination}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            {firstLeg.origin} <ArrowRight className="h-3.5 w-3.5 text-slate-400" /> {lastLeg?.destination}
            <span className="text-slate-400">· {tripTypeLabel(searchParams.tripType)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {new Date(firstLeg.departureDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short" })} ·{" "}
            {searchParams.passengers} Passenger{searchParams.passengers > 1 ? "s" : ""}
          </p>
          <p className="mt-0.5 text-sm capitalize text-slate-500">{searchParams.cabinClass.toLowerCase().replace("_", " ")}</p>
          <button
            onClick={onEditSearch}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit search
          </button>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">Sort by</p>
        <div className="space-y-0.5">
          {(
            [
              ["cheapest", "Least expensive"],
              ["expensive", "Most expensive"],
              ["shortest", "Shortest duration"],
              ["longest", "Longest duration"],
            ] as [SortOption, string][]
          ).map(([value, label]) => (
            <label key={value} className={labelClass}>
              <input
                type="radio"
                name="sortBy"
                checked={filters.sortBy === value}
                onChange={() => update("sortBy", value)}
                className={radioClass}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">Stops</p>
        <div className="space-y-0.5">
          {(
            [
              ["direct", "Direct only"],
              ["1", "1 stop at most"],
              ["2", "2 stops at most"],
              ["any", "Any number of stops"],
            ] as [StopsOption, string][]
          ).map(([value, label]) => (
            <label key={value} className={labelClass}>
              <input
                type="radio"
                name="stops"
                checked={filters.stops === value}
                onChange={() => update("stops", value)}
                className={radioClass}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">Airlines</p>
        <select
          value={filters.airline}
          onChange={(e) => update("airline", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All airlines</option>
          {airlines.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">Flight number</p>
        <input
          value={filters.flightNumber}
          onChange={(e) => update("flightNumber", e.target.value.toUpperCase())}
          placeholder="e.g. PK301"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-900">Flight time</p>

        <div className="mb-4">
          <p className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <PlaneTakeoff className="h-3.5 w-3.5" /> Take-off
            </span>
            <span className="text-slate-400">
              {minutesToClock(filters.takeoffRange[0])} – {minutesToClock(filters.takeoffRange[1])}
            </span>
          </p>
          <DualRangeSlider
            range={filters.takeoffRange}
            onChange={(range) => update("takeoffRange", range)}
          />
        </div>

        <div>
          <p className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <PlaneLanding className="h-3.5 w-3.5" /> Landing
            </span>
            <span className="text-slate-400">
              {minutesToClock(filters.landingRange[0])} – {minutesToClock(filters.landingRange[1])}
            </span>
          </p>
          <DualRangeSlider
            range={filters.landingRange}
            onChange={(range) => update("landingRange", range)}
          />
        </div>
      </div>
    </div>
  );
}

// Two overlapping range inputs — a common lightweight way to get a
// dual-handle slider without a extra dependency.
function DualRangeSlider({
  range,
  onChange,
}: {
  range: [number, number];
  onChange: (range: [number, number]) => void;
}) {
  const [min, max] = range;

  return (
    <div className="relative h-5">
      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-900"
        style={{ left: `${(min / 1439) * 100}%`, right: `${100 - (max / 1439) * 100}%` }}
      />
      <input
        type="range"
        min={0}
        max={1439}
        step={15}
        value={min}
        onChange={(e) => onChange([Math.min(Number(e.target.value), max - 15), max])}
        className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
      />
      <input
        type="range"
        min={0}
        max={1439}
        step={15}
        value={max}
        onChange={(e) => onChange([min, Math.max(Number(e.target.value), min + 15)])}
        className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
      />
    </div>
  );
}