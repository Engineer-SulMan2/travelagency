import type { FlightSearchParams, FlightResult, FlightItinerary, FlightSegment } from "@/types/flight";
import { parseIsoDurationToMinutes } from "./iso-duration";

// Amadeus for Developers — kept only for accounts that have migrated to an
// Amadeus Enterprise contract; the self-service portal was decommissioned
// 17 July 2026 (see provider.ts). Docs:
// https://developers.amadeus.com/self-service/category/flights
//
// Note: Amadeus's v2 flight-offers search only accepts ONE originDestination
// pair per call for round-trip (it has a dedicated returnDate param), but
// true multi-city (3+ distinct legs) isn't supported by the v2 endpoint at
// all — only origin/destination/departureDate/returnDate. For MULTI_CITY
// searches, this throws and the app falls back to mock data automatically.

const AMADEUS_BASE =
  process.env.AMADEUS_ENV === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.token;
  }

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_CLIENT_ID ?? "",
      client_secret: process.env.AMADEUS_CLIENT_SECRET ?? "",
    }),
  });

  if (!res.ok) {
    throw new Error(`Amadeus OAuth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

type AmadeusOffer = {
  id: string;
  price: { total: string };
  numberOfBookableSeats?: number;
  itineraries: { segments: AmadeusSegment[] }[];
};

type AmadeusSegment = {
  carrierCode: string;
  number: string;
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
  duration: string;
};

export async function searchAmadeusFlights(params: FlightSearchParams): Promise<FlightResult[]> {
  if (params.tripType === "MULTI_CITY") {
    throw new Error("Amadeus v2 flight-offers search doesn't support multi-city (3+ legs)");
  }

  const token = await getAccessToken();
  const firstLeg = params.legs[0];

  const qs = new URLSearchParams({
    originLocationCode: firstLeg.origin,
    destinationLocationCode: firstLeg.destination,
    departureDate: firstLeg.departureDate,
    adults: String(params.passengers),
    travelClass: params.cabinClass,
    currencyCode: "PKR",
    max: "10",
  });
  if (params.legs[1]) qs.set("returnDate", params.legs[1].departureDate);

  const res = await fetch(`${AMADEUS_BASE}/v2/shopping/flight-offers?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Amadeus flight search failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const offers: AmadeusOffer[] = json.data ?? [];
  const carriers: Record<string, string> = json.dictionaries?.carriers ?? {};

  return offers.map((offer, i) => {
    const itineraries: FlightItinerary[] = offer.itineraries.map((it) => ({
      segments: it.segments.map(
        (seg): FlightSegment => ({
          airline: carriers[seg.carrierCode] ?? seg.carrierCode,
          airlineCode: seg.carrierCode,
          flightNumber: `${seg.carrierCode}${seg.number}`,
          origin: seg.departure.iataCode,
          destination: seg.arrival.iataCode,
          departureAt: seg.departure.at,
          arrivalAt: seg.arrival.at,
          durationMinutes: parseIsoDurationToMinutes(seg.duration),
        })
      ),
    }));

    return {
      id: offer.id ?? `amadeus-${i}`,
      itineraries,
      cabinClass: params.cabinClass,
      netFare: Math.round(Number(offer.price.total)),
      currency: "PKR",
      seatsLeft: offer.numberOfBookableSeats ?? 9,
      refundable: false,
    };
  });
}