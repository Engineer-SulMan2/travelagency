"use client";

import { useState } from "react";
import { Search, Building2, DoorOpen } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { DatePicker } from "@/components/ui/date-picker";
import type { HotelSearchParams } from "@/types/hotel";

function defaultCheckIn() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}
function defaultCheckOut() {
  const d = new Date();
  d.setDate(d.getDate() + 9);
  return d.toISOString().slice(0, 10);
}

export function HotelSearchForm({
  onSearch,
  loading,
}: {
  onSearch: (params: HotelSearchParams) => void;
  loading: boolean;
}) {
  const [city, setCity] = useState("Islamabad");
  const [checkIn, setCheckIn] = useState(defaultCheckIn());
  const [checkOut, setCheckOut] = useState(defaultCheckOut());
  const [rooms, setRooms] = useState(1);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in");
      return;
    }
    setError(null);
    onSearch({ city, checkIn, checkOut, rooms });
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className={labelClass}>City</label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass}>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Check-in</label>
          <DatePicker
            value={checkIn}
            onChange={setCheckIn}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>

        <div>
          <label className={labelClass}>Check-out</label>
          <DatePicker value={checkOut} onChange={setCheckOut} min={checkIn} />
        </div>

        <div>
          <label className={labelClass}>Rooms</label>
          <div className="relative">
            <DoorOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min={1}
              max={6}
              value={rooms}
              onChange={(e) => setRooms(Math.min(6, Math.max(1, Number(e.target.value))))}
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          {loading ? "Searching..." : "Search hotels"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}