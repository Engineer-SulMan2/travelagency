import type { HotelSearchParams, HotelResult } from "@/types/hotel";
import { convertToPKR } from "@/lib/currency";
import { CITY_COORDINATES } from "./city-coordinates";

// Duffel Stays — self-service hotel/accommodation search (replaces the
// now-decommissioned Amadeus self-service hotel API, shut down 17 July
// 2026). Docs: https://duffel.com/docs/guides/getting-started-with-stays
//
// Requires DUFFEL_API_KEY. Note: unlike Duffel Flights, Stays access must
// be requested separately from your Duffel dashboard (a quick approval,
// not instant) — see https://duffel.com/contact-us. Until access is
// granted, calls here will fail and the app falls back to mock data
// automatically (see provider.ts).

const DUFFEL_BASE = "https://api.duffel.com";

type DuffelRate = {
  cancellation_timeline?: unknown[];
};

type DuffelRoom = {
  name?: string;
  rates?: DuffelRate[];
};

type DuffelSearchResult = {
  cheapest_rate_total_amount: string;
  cheapest_rate_currency: string;
  accommodation: {
    id: string;
    name: string;
    rating?: number | null;
    location?: { address?: { city_name?: string } };
    rooms?: DuffelRoom[];
    amenities?: { type: string; description: string }[];
  };
};

export async function searchDuffelHotels(params: HotelSearchParams): Promise<HotelResult[]> {
  const apiKey = process.env.DUFFEL_API_KEY ?? "";
  const coords = CITY_COORDINATES[params.city];
  if (!coords) {
    throw new Error(`No coordinates mapped for "${params.city}"`);
  }

  const res = await fetch(`${DUFFEL_BASE}/stays/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      data: {
        rooms: params.rooms,
        check_in_date: params.checkIn,
        check_out_date: params.checkOut,
        guests: [{ type: "adult" }],
        location: {
          radius: 15,
          geographic_coordinates: { latitude: coords.latitude, longitude: coords.longitude },
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Duffel Stays search failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const results: DuffelSearchResult[] = json.data?.results ?? [];

  const nights = Math.max(
    1,
    Math.round(
      (new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return results.slice(0, 15).map((r) => {
    const totalForStay = convertToPKR(Number(r.cheapest_rate_total_amount), r.cheapest_rate_currency);
    const room = r.accommodation.rooms?.[0];
    const firstRate = room?.rates?.[0];

    return {
      id: r.accommodation.id,
      name: r.accommodation.name,
      city: r.accommodation.location?.address?.city_name ?? params.city,
      starRating: r.accommodation.rating ?? 3,
      roomType: room?.name ?? "Standard Room",
      netFarePerNight: Math.round(totalForStay / (nights * params.rooms)),
      currency: "PKR",
      amenities: (r.accommodation.amenities ?? []).slice(0, 5).map((a) => a.description),
      freeCancellation: Boolean(firstRate?.cancellation_timeline?.length),
    };
  });
}