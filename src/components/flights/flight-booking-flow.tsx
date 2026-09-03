"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useBookingStore } from "@/stores/booking-store";
import { createBooking } from "@/lib/actions/create-booking";
import { FlightSearchForm } from "./search-form";
import { FlightResultsList } from "./results-list";
import { FlightFiltersSidebar, DEFAULT_FILTERS, type FlightFilters } from "./flight-filters-sidebar";
import { PassengerForm } from "./passenger-form";
import { BookingReview } from "./booking-review";
import { BookingConfirmation } from "./booking-confirmation";
import type { FlightResult, FlightSearchParams } from "@/types/flight";

function timeOfDayMinutes(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function applyFilters(results: FlightResult[], filters: FlightFilters): FlightResult[] {
  const filtered = results.filter((flight) => {
    const firstItinerary = flight.itineraries[0];
    const stopCount = firstItinerary.segments.length - 1;

    if (filters.stops === "direct" && stopCount > 0) return false;
    if (filters.stops === "1" && stopCount > 1) return false;
    if (filters.stops === "2" && stopCount > 2) return false;

    if (filters.airline) {
      const hasAirline = flight.itineraries.some((it) => it.segments.some((s) => s.airlineCode === filters.airline));
      if (!hasAirline) return false;
    }

    if (filters.flightNumber.trim()) {
      const hasFlightNumber = flight.itineraries.some((it) =>
        it.segments.some((s) => s.flightNumber.includes(filters.flightNumber.trim()))
      );
      if (!hasFlightNumber) return false;
    }

    const firstSeg = firstItinerary.segments[0];
    const lastSeg = firstItinerary.segments[firstItinerary.segments.length - 1];
    const takeoffMinutes = timeOfDayMinutes(firstSeg.departureAt);
    const landingMinutes = timeOfDayMinutes(lastSeg.arrivalAt);

    if (takeoffMinutes < filters.takeoffRange[0] || takeoffMinutes > filters.takeoffRange[1]) return false;
    if (landingMinutes < filters.landingRange[0] || landingMinutes > filters.landingRange[1]) return false;

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (filters.sortBy === "cheapest") return a.netFare - b.netFare;
    if (filters.sortBy === "expensive") return b.netFare - a.netFare;

    const durationOf = (f: FlightResult) =>
      f.itineraries[0].segments.reduce((sum, s) => sum + s.durationMinutes, 0);
    if (filters.sortBy === "shortest") return durationOf(a) - durationOf(b);
    return durationOf(b) - durationOf(a);
  });

  return sorted;
}

export function FlightBookingFlow({ markupPct }: { markupPct: number }) {
  const {
    step,
    searchParams,
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

  const [filters, setFilters] = useState<FlightFilters>(DEFAULT_FILTERS);

  const searchMutation = useMutation({
    mutationFn: async (params: FlightSearchParams) => {
      const res = await fetch("/api/flights/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      return data.results;
    },
    onSuccess: (data) => {
      setResults(data);
      setFilters(DEFAULT_FILTERS);
    },
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

  const filteredResults = useMemo(() => applyFilters(results, filters), [results, filters]);

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
            <p className="text-sm text-red-600">{(searchMutation.error as Error)?.message ?? "Couldn't search flights. Please try again."}</p>
          )}
          {!searchMutation.isPending && results.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
              <aside className="lg:sticky lg:top-6 lg:self-start">
                <FlightFiltersSidebar
                  searchParams={searchParams}
                  results={results}
                  filters={filters}
                  onChange={setFilters}
                  onEditSearch={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                />
              </aside>
              <div>
                <p className="mb-3 text-sm text-slate-500">
                  {filteredResults.length} of {results.length} flight{results.length !== 1 ? "s" : ""}
                </p>
                <FlightResultsList results={filteredResults} markupPct={markupPct} onSelect={selectFlight} />
              </div>
            </div>
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