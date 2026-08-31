import type { HotelSearchParams, HotelResult } from "@/types/hotel";
import { CITY_IATA_CODES } from "./city-codes";

// Amadeus for Developers — Hotel Search API.
// Docs: https://developers.amadeus.com/self-service/category/hotels
// Reuses the same OAuth token cache as the flight provider would, but kept
// separate here to keep each provider file self-contained.

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

type AmadeusHotelListEntry = { hotelId: string; name: string; rating?: string };

type AmadeusHotelOffer = {
  hotel: { hotelId: string; name: string; rating?: string };
  offers: {
    price: { total: string };
    room?: { typeEstimated?: { category?: string } };
    policies?: { cancellation?: { type?: string } };
  }[];
};

export async function searchAmadeusHotels(params: HotelSearchParams): Promise<HotelResult[]> {
  const cityCode = CITY_IATA_CODES[params.city];
  if (!cityCode) {
    throw new Error(`No IATA city code mapped for "${params.city}"`);
  }

  const token = await getAccessToken();

  // Step 1: find hotels in the city
  const listRes = await fetch(
    `${AMADEUS_BASE}/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) {
    throw new Error(`Amadeus hotel list failed: ${listRes.status} ${await listRes.text()}`);
  }
  const listJson = await listRes.json();
  const hotelIds: string[] = (listJson.data ?? [])
    .slice(0, 20)
    .map((h: AmadeusHotelListEntry) => h.hotelId);

  if (hotelIds.length === 0) return [];

  // Step 2: get live offers for those hotels
  const qs = new URLSearchParams({
    hotelIds: hotelIds.join(","),
    checkInDate: params.checkIn,
    checkOutDate: params.checkOut,
    roomQuantity: String(params.rooms),
    currency: "PKR",
    bestRateOnly: "true",
  });

  const offersRes = await fetch(`${AMADEUS_BASE}/v3/shopping/hotel-offers?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!offersRes.ok) {
    throw new Error(`Amadeus hotel offers failed: ${offersRes.status} ${await offersRes.text()}`);
  }
  const offersJson = await offersRes.json();
  const entries: AmadeusHotelOffer[] = offersJson.data ?? [];

  const nights = Math.max(
    1,
    Math.round(
      (new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  return entries
    .filter((e) => e.offers.length > 0)
    .map((e) => {
      const offer = e.offers[0];
      const totalForStay = Number(offer.price.total);
      return {
        id: e.hotel.hotelId,
        name: e.hotel.name,
        city: params.city,
        starRating: e.hotel.rating ? Number(e.hotel.rating) : 3,
        roomType: offer.room?.typeEstimated?.category ?? "Standard Room",
        netFarePerNight: Math.round(totalForStay / (nights * params.rooms)),
        currency: "PKR",
        amenities: [],
        freeCancellation: offer.policies?.cancellation?.type === "FULL_STAY",
      };
    });
}
