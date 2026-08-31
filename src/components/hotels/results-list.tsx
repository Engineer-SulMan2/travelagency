"use client";

import { Star, Building2, ShieldCheck } from "lucide-react";
import type { HotelResult } from "@/types/hotel";

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

export function HotelResultsList({
  results,
  markupPct,
  nights,
  onSelect,
}: {
  results: HotelResult[];
  markupPct: number;
  nights: number;
  onSelect: (hotel: HotelResult) => void;
}) {
  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No hotels found. Try different dates or a different city.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((hotel) => {
        const sellingPerNight = Math.round(hotel.netFarePerNight * (1 + markupPct / 100));
        return (
          <div
            key={hotel.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <Building2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{hotel.name}</p>
                <div className="mt-0.5 flex items-center gap-0.5">
                  {Array.from({ length: hotel.starRating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-1 text-sm text-slate-600">{hotel.roomType}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hotel.amenities.map((a) => (
                    <span key={a} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {a}
                    </span>
                  ))}
                  {hotel.freeCancellation && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <ShieldCheck className="h-3 w-3" /> Free cancellation
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900">
                  {formatMoney(sellingPerNight)}
                  <span className="text-xs font-normal text-slate-400"> / night</span>
                </p>
                <p className="text-xs text-slate-400">
                  Net {formatMoney(hotel.netFarePerNight)} + {markupPct}% · {nights} night{nights > 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => onSelect(hotel)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
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