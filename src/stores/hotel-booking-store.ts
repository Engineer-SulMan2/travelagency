import { create } from "zustand";
import type { HotelResult, HotelSearchParams } from "@/types/hotel";

export type GuestDraft = {
  title: "Mr" | "Mrs" | "Ms";
  firstName: string;
  lastName: string;
};

export type HotelBookingStep = "search" | "guests" | "review" | "confirmed";

type HotelBookingStore = {
  step: HotelBookingStep;
  searchParams: HotelSearchParams | null;
  results: HotelResult[];
  selectedHotel: HotelResult | null;
  nights: number;
  guests: GuestDraft[];
  bookingRef: string | null;

  setSearchParams: (params: HotelSearchParams, nights: number) => void;
  setResults: (results: HotelResult[]) => void;
  selectHotel: (hotel: HotelResult) => void;
  setGuests: (guests: GuestDraft[]) => void;
  goToReview: () => void;
  backToGuests: () => void;
  confirmBooking: (bookingRef: string) => void;
  backToResults: () => void;
  reset: () => void;
};

function emptyGuest(): GuestDraft {
  return { title: "Mr", firstName: "", lastName: "" };
}

export const useHotelBookingStore = create<HotelBookingStore>((set, get) => ({
  step: "search",
  searchParams: null,
  results: [],
  selectedHotel: null,
  nights: 1,
  guests: [],
  bookingRef: null,

  setSearchParams: (params, nights) => set({ searchParams: params, nights }),
  setResults: (results) => set({ results }),

  selectHotel: (hotel) => {
    const roomCount = get().searchParams?.rooms ?? 1;
    set({
      selectedHotel: hotel,
      guests: Array.from({ length: roomCount }, emptyGuest),
      step: "guests",
    });
  },

  setGuests: (guests) => set({ guests }),
  goToReview: () => set({ step: "review" }),
  backToGuests: () => set({ step: "guests" }),
  confirmBooking: (bookingRef) => set({ step: "confirmed", bookingRef }),
  backToResults: () => set({ step: "search", selectedHotel: null }),

  reset: () =>
    set({
      step: "search",
      searchParams: null,
      results: [],
      selectedHotel: null,
      nights: 1,
      guests: [],
      bookingRef: null,
    }),
}));
