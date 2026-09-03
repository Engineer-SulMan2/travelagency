import type { FlightSearchParams, FlightResult, FlightItinerary, FlightSegment } from "@/types/flight";
import { parseIsoDurationToMinutes } from "./iso-duration";

// Duffel flight search. Docs: https://duffel.com/docs/api/overview/open-api-spec
// Requires DUFFEL_API_KEY (test tokens start with "duffel_test_"). Supports
// one-way, round-trip and multi-city — each requested leg becomes one
// "slice" in the offer request, and Duffel prices them together as a
// single combined offer per result (matching how real GDS fares work).

const DUFFEL_BASE = "https://api.duffel.com";

const CABIN_CLASS_MAP: Record<string, string> = {
  ECONOMY: "economy",
  PREMIUM_ECONOMY: "premium_economy",
  BUSINESS: "business",
  FIRST: "first",
};

type DuffelSegment = {
  marketing_carrier?: { name?: string; iata_code?: string; logo_symbol_url?: string };
  marketing_carrier_flight_number?: string;
  origin: { iata_code: string };
  destination: { iata_code: string };
  departing_at: string;
  arriving_at: string;
  duration?: string;
};

type DuffelSlice = { segments: DuffelSegment[] };

type DuffelOffer = {
  id: string;
  total_amount: string;
  slices: DuffelSlice[];
};

export async function searchDuffelFlights(params: FlightSearchParams): Promise<FlightResult[]> {
  const apiKey = process.env.DUFFEL_API_KEY ?? "";

  const slices = params.legs.map((leg) => ({
    origin: leg.origin,
    destination: leg.destination,
    departure_date: leg.departureDate,
  }));

  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests?return_offers=true`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      data: {
        slices,
        passengers: Array.from({ length: params.passengers }, () => ({ type: "adult" })),
        cabin_class: CABIN_CLASS_MAP[params.cabinClass] ?? "economy",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Duffel flight search failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const offers: DuffelOffer[] = json.data?.offers ?? [];

  return offers.slice(0, 10).map((offer) => {
    const itineraries: FlightItinerary[] = offer.slices.map((slice) => ({
      segments: slice.segments.map(
               (seg): FlightSegment => ({
          airline: seg.marketing_carrier?.name ?? "Unknown",
          airlineCode: seg.marketing_carrier?.iata_code ?? "",
          airlineLogoUrl: seg.marketing_carrier?.logo_symbol_url ?? null,
          flightNumber: `${seg.marketing_carrier?.iata_code ?? ""}${seg.marketing_carrier_flight_number ?? ""}`,
          origin: seg.origin.iata_code,
          destination: seg.destination.iata_code,
          departureAt: seg.departing_at,
          arrivalAt: seg.arriving_at,
          durationMinutes: parseIsoDurationToMinutes(seg.duration ?? "PT0M"),
        })
      ),
    }));

    return {
      id: offer.id,
      itineraries,
      cabinClass: params.cabinClass,
      netFare: Math.round(Number(offer.total_amount)),
      currency: "PKR",
      seatsLeft: 9, // Duffel doesn't expose remaining inventory pre-booking
      refundable: false,
    };
  });
}