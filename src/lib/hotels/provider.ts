import type { HotelSearchParams, HotelResult } from "@/types/hotel";
import { searchMockHotels } from "@/lib/mock-hotels";
import { searchDuffelHotels } from "./duffel";
import { searchAmadeusHotels } from "./amadeus";

export type HotelProviderName = "mock" | "duffel" | "amadeus";

// Set HOTEL_PROVIDER=duffel (with DUFFEL_API_KEY) to go live — this is the
// recommended provider since Amadeus decommissioned its self-service
// portal on 17 July 2026 (amadeus.ts is kept only for accounts that have
// since migrated to an Amadeus Enterprise contract).
//
// Note: Duffel Stays access must be requested separately from your Duffel
// dashboard (https://duffel.com/contact-us) — it isn't enabled by default
// alongside Flights. Until it's approved, calls here fail and the app
// falls back to mock data automatically.
export function getActiveHotelProvider(): HotelProviderName {
  const configured = (process.env.HOTEL_PROVIDER ?? "").toLowerCase();
  if (configured === "duffel" && process.env.DUFFEL_API_KEY) {
    return "duffel";
  }
  if (configured === "amadeus" && process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    return "amadeus";
  }
  return "mock";
}

export async function searchHotels(params: HotelSearchParams): Promise<HotelResult[]> {
  const provider = getActiveHotelProvider();

  try {
    if (provider === "duffel") return await searchDuffelHotels(params);
    if (provider === "amadeus") return await searchAmadeusHotels(params);
  } catch (err) {
    console.error(`[hotels] "${provider}" search failed, falling back to mock:`, err);
  }

  return searchMockHotels(params);
}