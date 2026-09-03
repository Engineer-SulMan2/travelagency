"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Search, Users2, Armchair, Plus, X, Star, BookmarkPlus } from "lucide-react";
import { AirportAutocomplete } from "@/components/flights/airport-autocomplete";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { addSavedRoute, deleteSavedRoute, getMySavedRoutes, type SavedRouteRow } from "@/lib/actions/saved-routes";
import type { CabinClass, FlightSearchLeg, FlightSearchParams, TripType } from "@/types/flight";

const CABIN_OPTIONS: { value: CabinClass; label: string }[] = [
  { value: "ECONOMY", label: "Economy" },
  { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First" },
];

const TRIP_TYPE_OPTIONS: { value: TripType; label: string }[] = [
  { value: "ONE_WAY", label: "One Way" },
  { value: "ROUND_TRIP", label: "Return" },
  { value: "MULTI_CITY", label: "Multi-city" },
];

function defaultDate(offsetDays = 7) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const MAX_MULTI_CITY_LEGS = 5;

export function FlightSearchForm({
  onSearch,
  loading,
}: {
  onSearch: (params: FlightSearchParams) => void;
  loading: boolean;
}) {
  const [tripType, setTripType] = useState<TripType>("ONE_WAY");
  const [legs, setLegs] = useState<FlightSearchLeg[]>([
    { origin: "KHI", destination: "DXB", departureDate: defaultDate() },
  ]);
  const [returnDate, setReturnDate] = useState(defaultDate(14));
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<CabinClass>("ECONOMY");
  const [error, setError] = useState<string | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteRow[]>([]);
  const [savingRoute, setSavingRoute] = useState(false);

  useEffect(() => {
    getMySavedRoutes().then(setSavedRoutes);
  }, []);

  function applyRoute(route: SavedRouteRow) {
    setLegs((prev) => [{ ...prev[0], origin: route.origin, destination: route.destination }, ...prev.slice(1)]);
  }

  async function handleSaveRoute() {
    const first = legs[0];
    if (!first?.origin || !first?.destination) return;
    setSavingRoute(true);
    const fd = new FormData();
    fd.set("origin", first.origin);
    fd.set("destination", first.destination);
    const res = await addSavedRoute({}, fd);
    setSavingRoute(false);
    if (!res.error) {
      const fresh = await getMySavedRoutes();
      setSavedRoutes(fresh);
    }
  }

  async function handleRemoveRoute(id: string) {
    await deleteSavedRoute(id);
    setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
  }

  function updateLeg(index: number, field: keyof FlightSearchLeg, value: string) {
    setLegs((prev) => prev.map((leg, i) => (i === index ? { ...leg, [field]: value } : leg)));
  }

  function swapLeg(index: number) {
    setLegs((prev) =>
      prev.map((leg, i) => (i === index ? { ...leg, origin: leg.destination, destination: leg.origin } : leg))
    );
  }

  function addLeg() {
    const last = legs[legs.length - 1];
    setLegs((prev) => [
      ...prev,
      { origin: last?.destination ?? "", destination: "", departureDate: defaultDate(7 + prev.length * 3) },
    ]);
  }

  function removeLeg(index: number) {
    setLegs((prev) => prev.filter((_, i) => i !== index));
  }

  function switchTripType(next: TripType) {
    setTripType(next);
    setError(null);
    if (next === "ONE_WAY") {
      setLegs((prev) => [prev[0] ?? { origin: "KHI", destination: "DXB", departureDate: defaultDate() }]);
    } else if (next === "ROUND_TRIP") {
      setLegs((prev) => [prev[0] ?? { origin: "KHI", destination: "DXB", departureDate: defaultDate() }]);
    } else if (next === "MULTI_CITY") {
      setLegs((prev) => {
        const base = prev[0] ?? { origin: "KHI", destination: "DXB", departureDate: defaultDate() };
        return prev.length >= 2 ? prev : [base, { origin: base.destination, destination: "", departureDate: defaultDate(14) }];
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    for (const leg of legs) {
      if (!leg.origin || !leg.destination) {
        setError("Please choose an origin and destination for every leg.");
        return;
      }
      if (leg.origin === leg.destination) {
        setError("Origin and destination can't be the same.");
        return;
      }
    }

    setError(null);

    const finalLegs: FlightSearchLeg[] =
      tripType === "ROUND_TRIP" ? [legs[0], { origin: legs[0].destination, destination: legs[0].origin, departureDate: returnDate }] : legs;

    onSearch({ tripType, legs: finalLegs, passengers, cabinClass });
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      {/* Trip type tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
        {TRIP_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => switchTripType(opt.value)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
              tripType === opt.value ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Saved routes */}
      {savedRoutes.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-amber-400" />
          {savedRoutes.map((r) => (
            <span
              key={r.id}
              className="group flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <button type="button" onClick={() => applyRoute(r)} className="hover:text-indigo-700">
                {r.label ? `${r.label} (${r.origin} → ${r.destination})` : `${r.origin} → ${r.destination}`}
              </button>
              <button
                type="button"
                onClick={() => handleRemoveRoute(r.id)}
                className="rounded-full p-0.5 text-slate-300 hover:bg-white hover:text-red-500"
                aria-label="Remove saved route"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Legs */}
      <div className="space-y-3">
        {legs.map((leg, i) => (
          <div key={i} className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className={labelClass}>{tripType === "MULTI_CITY" ? `Leg ${i + 1} — From` : "From"}</label>
              <AirportAutocomplete
                value={leg.origin}
                onChange={(code) => updateLeg(i, "origin", code)}
                placeholder="City or airport"
              />
            </div>

            <div className="flex justify-center md:col-span-1">
              <button
                type="button"
                onClick={() => swapLeg(i)}
                className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                aria-label="Swap origin and destination"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="md:col-span-4">
              <label className={labelClass}>To</label>
              <AirportAutocomplete
                value={leg.destination}
                onChange={(code) => updateLeg(i, "destination", code)}
                placeholder="City or airport"
              />
            </div>

            <div className={tripType === "MULTI_CITY" && legs.length > 1 ? "md:col-span-2" : "md:col-span-3"}>
              <label className={labelClass}>Depart</label>
              <DatePicker
                value={leg.departureDate}
                onChange={(v) => updateLeg(i, "departureDate", v)}
                min={i === 0 ? new Date().toISOString().slice(0, 10) : legs[i - 1]?.departureDate}
              />
            </div>

            {tripType === "MULTI_CITY" && legs.length > 1 && (
              <div className="flex md:col-span-1">
                <button
                  type="button"
                  onClick={() => removeLeg(i)}
                  className="rounded-lg border border-red-200 p-2.5 text-red-500 transition hover:bg-red-50"
                  aria-label="Remove leg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}

        {tripType === "ROUND_TRIP" && (
          <div className="max-w-xs">
            <label className={labelClass}>Return</label>
            <DatePicker value={returnDate} onChange={setReturnDate} min={legs[0]?.departureDate} />
          </div>
        )}

        {tripType === "MULTI_CITY" && legs.length < MAX_MULTI_CITY_LEGS && (
          <button
            type="button"
            onClick={addLeg}
            className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add another leg
          </button>
        )}
      </div>

      {/* Passengers, cabin, search */}
      <div className="mt-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass}>Passengers</label>
          <div className="relative">
            <Users2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min={1}
              max={9}
              value={passengers}
              onChange={(e) => setPassengers(Math.min(9, Math.max(1, Number(e.target.value))))}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Cabin class</label>
          <div className="relative">
            <Armchair className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={cabinClass} onChange={(e) => setCabinClass(e.target.value as CabinClass)} className={fieldClass}>
              {CABIN_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-transparent sm:hidden lg:block">Search</label>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loading ? "Searching..." : "Search flights"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSaveRoute}
        disabled={savingRoute || !legs[0]?.origin || !legs[0]?.destination}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-indigo-600 disabled:opacity-40"
      >
        <BookmarkPlus className="h-3.5 w-3.5" /> {savingRoute ? "Saving..." : "Save this route for quick access"}
      </button>
    </form>
  );
}