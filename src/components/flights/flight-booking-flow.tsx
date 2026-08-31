"use client";

import { useMutation } from "@tanstack/react-query";
import { useBookingStore } from "@/stores/booking-store";
import { createBooking } from "@/lib/actions/create-booking";
import { FlightSearchForm } from "./search-form";
import { FlightResultsList } from "./results-list";
import { PassengerForm } from "./passenger-form";
import { BookingReview } from "./booking-review";
import { BookingConfirmation } from "./booking-confirmation";
import type { FlightSearchParams } from "@/types/flight";

export function FlightBookingFlow({ markupPct }: { markupPct: number }) {
  const {
    step,
    results,
    selectedFlight,
    passengers,
    bookingRef,
    setSearchParams,
    setResults,
    selectFlight,
    setPassengers,
    goToReview,
    confirmBooking,
    backToResults,
    reset,
  } = useBookingStore();

  const searchMutation = useMutation({
    mutationFn: async (params: FlightSearchParams) => {
      const res = await fetch("/api/flights/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      return data.results;
    },
    onSuccess: (data) => setResults(data),
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFlight) throw new Error("No flight selected");
      return createBooking(selectedFlight, passengers);
    },
    onSuccess: (data) => confirmBooking(data.bookingRef),
  });

  function handleSearch(params: FlightSearchParams) {
    setSearchParams(params);
    searchMutation.mutate(params);
  }

  return (
    <div className="space-y-5">
      {step === "search" && (
        <>
          <FlightSearchForm onSearch={handleSearch} loading={searchMutation.isPending} />
          {searchMutation.isPending && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Searching flights...
            </div>
          )}
          {searchMutation.isError && (
            <p className="text-sm text-red-600">Couldn&apos;t search flights. Please try again.</p>
          )}
          {!searchMutation.isPending && results.length > 0 && (
            <FlightResultsList results={results} markupPct={markupPct} onSelect={selectFlight} />
          )}
        </>
      )}

      {step === "passengers" && selectedFlight && (
        <PassengerForm
          initialPassengers={passengers}
          onBack={backToResults}
          onContinue={(p) => {
            setPassengers(p);
            goToReview();
          }}
        />
      )}

      {step === "review" && selectedFlight && (
        <BookingReview
          flight={selectedFlight}
          passengers={passengers}
          markupPct={markupPct}
          onBack={() => useBookingStore.setState({ step: "passengers" })}
          onConfirm={async () => {
            await bookingMutation.mutateAsync();
          }}
        />
      )}

      {step === "confirmed" && bookingRef && (
        <BookingConfirmation bookingRef={bookingRef} onNewSearch={reset} />
      )}
    </div>
  );
}