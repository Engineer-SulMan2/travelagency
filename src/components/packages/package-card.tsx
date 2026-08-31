"use client";

import { useActionState, useState } from "react";
import { MapPin, Calendar, Check } from "lucide-react";
import { createPackageBooking, type PackageBookingState } from "@/lib/actions/create-package-booking";
import { CustomerSearchSelect } from "@/components/customers/customer-search-select";
import { DatePicker } from "@/components/ui/date-picker";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { formatCurrency } from "@/lib/currency";
import type { PackageSummary } from "@/types/package";

function defaultTravelDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

const initialState: PackageBookingState = {};

export function PackageCard({
  pkg,
  markupPct,
  currency = "PKR",
}: {
  pkg: PackageSummary;
  markupPct: number;
  currency?: string;
}) {
  const formatMoney = (n: number) => formatCurrency(n, currency);
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, pending] = useActionState(createPackageBooking, initialState);
  const [travelDate, setTravelDate] = useState(defaultTravelDate());
  const [leadTravelerName, setLeadTravelerName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sellingPrice = Math.round(pkg.basePrice * (1 + markupPct / 100));
  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      {pkg.images.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {pkg.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img}
              alt={pkg.title}
              onClick={() => setLightboxIndex(i)}
              className={`h-28 w-full cursor-pointer rounded-xl object-cover transition hover:opacity-90 ${i === 0 && pkg.images.length === 1 ? "col-span-3" : ""}`}
            />
          ))}
        </div>
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold text-slate-900">{pkg.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5" /> {pkg.destination} · {pkg.durationDays} days
          </p>
          <p className="mt-2 text-sm text-slate-600">{pkg.description}</p>
          {pkg.remainingSeats != null && (
            <p className="mt-1.5 text-xs font-medium text-amber-600">
              Only {pkg.remainingSeats} seat{pkg.remainingSeats === 1 ? "" : "s"} left
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {pkg.inclusions.map((inc) => (
              <span
                key={inc}
                className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                <Check className="h-3 w-3" /> {inc}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-900">
              {formatMoney(sellingPrice)}
              <span className="text-xs font-normal text-slate-400"> / traveler</span>
            </p>
            <p className="text-xs text-slate-400">
              Net {formatMoney(pkg.basePrice)} + {markupPct}%
            </p>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
          >
            {expanded ? "Close" : "Book this package"}
          </button>
        </div>
      </div>

      {expanded && !state.success && (
        <form action={formAction} className="mt-5 border-t border-slate-100 pt-4">
          <input type="hidden" name="packageId" value={pkg.id} />
          <input type="hidden" name="travelDate" value={travelDate} />
          <input type="hidden" name="leadTravelerName" value={leadTravelerName} />

          <div className="mb-4">
            <label className={labelClass}>Fill from saved customer (optional)</label>
            <CustomerSearchSelect
              selectedLabel={selectedCustomer}
              onSelect={(c) => {
                setLeadTravelerName(c.fullName);
                setSelectedCustomer(c.fullName);
              }}
              onClear={() => setSelectedCustomer(null)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Travel date</label>
              <DatePicker value={travelDate} onChange={setTravelDate} min={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label className={labelClass}>Travelers</label>
              <input
                type="number"
                name="travelers"
                min={1}
                max={20}
                defaultValue={1}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Lead traveler name</label>
              <input
                value={leadTravelerName}
                onChange={(e) => setLeadTravelerName(e.target.value)}
                required
                placeholder="Full name"
                className={fieldClass}
              />
            </div>
          </div>

          {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Booking..." : "Confirm booking"}
          </button>
        </form>
      )}

      {state.success && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Calendar className="h-4 w-4" />
          Booked! Reference: <span className="font-mono font-semibold">{state.bookingRef}</span>
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox images={pkg.images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}