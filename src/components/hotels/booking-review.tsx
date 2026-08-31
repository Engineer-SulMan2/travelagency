"use client";

import { useState } from "react";
import { ChevronLeft, CheckCircle2, Building2, Users, Receipt } from "lucide-react";
import type { HotelResult } from "@/types/hotel";
import type { GuestDraft } from "@/stores/hotel-booking-store";

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <Icon className="h-4 w-4 text-indigo-600" />
        </span>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
      </div>
      {children}
    </div>
  );
}

export function HotelBookingReview({
  hotel,
  checkIn,
  checkOut,
  nights,
  rooms,
  guests,
  markupPct,
  onBack,
  onConfirm,
}: {
  hotel: HotelResult;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  guests: GuestDraft[];
  markupPct: number;
  onBack: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markupAmount = Math.round(hotel.netFarePerNight * (markupPct / 100));
  const sellingFare = hotel.netFarePerNight + markupAmount;
  const total = sellingFare * nights * rooms;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong creating the booking. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900">
        <ChevronLeft className="h-4 w-4" /> Edit guests
      </button>

      <SectionCard icon={Building2} title="Hotel">
        <p className="text-sm text-slate-700">
          {hotel.name} — {hotel.roomType}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {checkIn} → {checkOut} · {nights} night{nights > 1 ? "s" : ""} · {rooms} room{rooms > 1 ? "s" : ""}
        </p>
      </SectionCard>

      <SectionCard icon={Users} title="Guests">
        <ul className="space-y-1.5 text-sm text-slate-700">
          {guests.map((g, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Room {i + 1}</span>
              <span>{g.title} {g.firstName} {g.lastName}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={Receipt} title="Fare breakdown">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Net rate (per room/night)</span>
            <span>{formatMoney(hotel.netFarePerNight)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Your markup ({markupPct}%)</span>
            <span>{formatMoney(markupAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-medium text-slate-900">
            <span>Selling rate (per room/night)</span>
            <span>{formatMoney(sellingFare)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>{nights} nights × {rooms} rooms</span>
            <span>× {nights * rooms}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-indigo-50 px-3 py-2.5 text-base font-semibold text-indigo-700">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </SectionCard>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50 sm:w-auto sm:px-6"
      >
        <CheckCircle2 className="h-4 w-4" />
        {submitting ? "Confirming..." : "Confirm booking"}
      </button>
    </div>
  );
}