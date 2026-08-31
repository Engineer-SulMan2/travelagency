"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, CalendarClock } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  amendFlightBooking,
  amendHotelBooking,
  amendPackageBooking,
  amendVisaBooking,
} from "@/lib/actions/amend-booking";
import { AMENDMENT_FEE } from "@/lib/amendment-fee";
import type { BookingSummary } from "@/types/booking-summary";

export function AmendBookingModal({
  booking,
  onClose,
}: {
  booking: BookingSummary;
  onClose: () => void;
}) {
  const router = useRouter();
  const isHotel = booking.type === "HOTEL";

  const [newDate, setNewDate] = useState(booking.amendableDate ?? "");
  const [newCheckIn, setNewCheckIn] = useState(booking.checkIn ?? "");
  const [newCheckOut, setNewCheckOut] = useState(booking.checkOut ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    let res;
    if (booking.type === "FLIGHT") {
      res = await amendFlightBooking(booking.id, newDate);
    } else if (booking.type === "HOTEL") {
      res = await amendHotelBooking(booking.id, newCheckIn, newCheckOut);
    } else if (booking.type === "PACKAGE") {
      res = await amendPackageBooking(booking.id, newDate);
    } else {
      res = await amendVisaBooking(booking.id, newDate);
    }

    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <CalendarClock className="h-4 w-4 text-indigo-600" />
            </span>
            <p className="text-sm font-semibold text-slate-900">Amend booking</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-slate-500">
          {booking.bookingRef} — {booking.title}
        </p>

        {isHotel ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">New check-in</label>
              <DatePicker value={newCheckIn} onChange={setNewCheckIn} min={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">New check-out</label>
              <DatePicker value={newCheckOut} onChange={setNewCheckOut} min={newCheckIn} />
            </div>
            <p className="text-xs text-slate-400">Must span the same number of nights as the original booking.</p>
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">New date</label>
            <DatePicker value={newDate} onChange={setNewDate} min={new Date().toISOString().slice(0, 10)} />
          </div>
        )}

        <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          An amendment fee of PKR {AMENDMENT_FEE.toLocaleString("en-PK")} will be debited from the wallet.
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Confirm amendment"}
        </button>
      </div>
    </div>
  );
}