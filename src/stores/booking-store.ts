import { create } from "zustand";
import type { FlightResult, FlightSearchParams } from "@/types/flight";

export type PassengerDraft = {
  type: "ADULT" | "CHILD" | "INFANT";
  title: "Mr" | "Mrs" | "Ms";
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  passportNumber: string;
};

export type BookingStep = "search" | "passengers" | "review" | "confirmed";

type BookingStore = {
  step: BookingStep;
  searchParams: FlightSearchParams | null;
  results: FlightResult[];
  selectedFlight: FlightResult | null;
  passengers: PassengerDraft[];
  bookingRef: string | null;

  setSearchParams: (params: FlightSearchParams) => void;
  setResults: (results: FlightResult[]) => void;
  selectFlight: (flight: FlightResult) => void;
  setPassengers: (passengers: PassengerDraft[]) => void;
  goToReview: () => void;
  confirmBooking: (bookingRef: string) => void;
  backToResults: () => void;
  reset: () => void;
};

function emptyPassenger(): PassengerDraft {
  return {
    type: "ADULT",
    title: "Mr",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    passportNumber: "",
  };
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  step: "search",
  searchParams: null,
  results: [],
  selectedFlight: null,
  passengers: [],
  bookingRef: null,

  setSearchParams: (params) => set({ searchParams: params }),
  setResults: (results) => set({ results }),

  selectFlight: (flight) => {
    const paxCount = get().searchParams?.passengers ?? 1;
    set({
      selectedFlight: flight,
      passengers: Array.from({ length: paxCount }, emptyPassenger),
      step: "passengers",
    });
  },

  setPassengers: (passengers) => set({ passengers }),

  goToReview: () => set({ step: "review" }),

  confirmBooking: (bookingRef) => set({ step: "confirmed", bookingRef }),

  backToResults: () => set({ step: "search", selectedFlight: null }),

  reset: () =>
    set({
      step: "search",
      searchParams: null,
      results: [],
      selectedFlight: null,
      passengers: [],
      bookingRef: null,
    }),
}));
