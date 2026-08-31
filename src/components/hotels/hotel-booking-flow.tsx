"use client";

import { useMutation } from "@tanstack/react-query";
import { useHotelBookingStore } from "@/stores/hotel-booking-store";
import { createHotelBooking } from "@/lib/actions/create-hotel-booking";
import { HotelSearchForm } from "./search-form";
import { HotelResultsList } from "./results-list";
import { GuestForm } from "./guest-form";
import { HotelBookingReview } from "./booking-review";
import { HotelBookingConfirmation } from "./booking-confirmation";
import type { HotelSearchParams } from "@/types/hotel";

function nightsBetween(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function HotelBookingFlow({ markupPct }: { markupPct: number }) {
  const {
    step,
    results,
    selectedHotel,
    nights,
    guests,
    searchParams,
    bookingRef,
    setSearchParams,
    setResults,
    selectHotel,
    setGuests,
    goToReview,
    backToGuests,
    confirmBooking,
    backToResults,
    reset,
  } = useHotelBookingStore();

  const searchMutation = useMutation({
    mutationFn: async (params: HotelSearchParams) => {
      const qs = new URLSearchParams({
        city: params.city,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        rooms: String(params.rooms),
      });
      const res = await fetch(`/api/hotels/search?${qs.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      return data.results;
    },
    onSuccess: (data) => setResults(data),
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedHotel || !searchParams) throw new Error("No hotel selected");
      return createHotelBooking(
        selectedHotel,
        searchParams.checkIn,
        searchParams.checkOut,
        nights,
        searchParams.rooms,
        guests
      );
    },
    onSuccess: (data) => confirmBooking(data.bookingRef),
  });

  function handleSearch(params: HotelSearchParams) {
    setSearchParams(params, nightsBetween(params.checkIn, params.checkOut));
    searchMutation.mutate(params);
  }

  return (
    <div className="space-y-5">
      {step === "search" && (
        <>
          <HotelSearchForm onSearch={handleSearch} loading={searchMutation.isPending} />
          {searchMutation.isPending && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Searching hotels...
            </div>
          )}
          {searchMutation.isError && (
            <p className="text-sm text-red-600">Couldn&apos;t search hotels. Please try again.</p>
          )}
          {!searchMutation.isPending && results.length > 0 && (
            <HotelResultsList
              results={results}
              markupPct={markupPct}
              nights={nights}
              onSelect={selectHotel}
            />
          )}
        </>
      )}

      {step === "guests" && selectedHotel && (
        <GuestForm
          initialGuests={guests}
          onBack={backToResults}
          onContinue={(g) => {
            setGuests(g);
            goToReview();
          }}
        />
      )}

      {step === "review" && selectedHotel && searchParams && (
        <HotelBookingReview
          hotel={selectedHotel}
          checkIn={searchParams.checkIn}
          checkOut={searchParams.checkOut}
          nights={nights}
          rooms={searchParams.rooms}
          guests={guests}
          markupPct={markupPct}
          onBack={backToGuests}
          onConfirm={async () => {
            await bookingMutation.mutateAsync();
          }}
        />
      )}

      {step === "confirmed" && bookingRef && (
        <HotelBookingConfirmation bookingRef={bookingRef} onNewSearch={reset} />
      )}
    </div>
  );
}
