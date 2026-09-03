import type { FlightSearchParams, FlightResult } from "@/types/flight";
import { searchMockFlights } from "@/lib/mock-flights";
import { searchDuffelFlights } from "./duffel";
import { searchAmadeusFlights } from "./amadeus";

export type FlightProviderName = "mock" | "duffel" | "amadeus";

// Set FLIGHT_PROVIDER=duffel (with DUFFEL_API_KEY) to go live — this is the
// recommended provider since Amadeus decommissioned its self-service
// portal on 17 July 2026 (amadeus.ts is kept only for accounts that have
// since migrated to an Amadeus Enterprise contract). Duffel Flights is
// fully self-service — no separate access request needed, unlike Stays
// (hotels).
export function getActiveFlightProvider(): FlightProviderName {
  const configured = (process.env.FLIGHT_PROVIDER ?? "").toLowerCase();
  if (configured === "duffel" && process.env.DUFFEL_API_KEY) {
    return "duffel";
  }
  if (configured === "amadeus" && process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    return "amadeus";
  }
  return "mock";
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightResult[]> {
  const provider = getActiveFlightProvider();

  // Deliberately NOT falling back to mock data on a live-provider error —
  // silently showing fake flights when Duffel/Amadeus fails would risk an
  // agent booking (and a customer paying for) a flight that doesn't
  // actually exist. If the live provider fails, the search fails visibly
  // instead, and the real error is available in the server logs.
  if (provider === "duffel") return await searchDuffelFlights(params);
  if (provider === "amadeus") return await searchAmadeusFlights(params);

  return searchMockFlights(params);
}