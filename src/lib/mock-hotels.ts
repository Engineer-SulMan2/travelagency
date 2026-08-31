import type { HotelResult, HotelSearchParams } from "@/types/hotel";

const HOTEL_NAMES = [
  "Grand Regency",
  "Serena Suites",
  "Pearl Continental View",
  "Marriott Gardens",
  "Skyline Boutique Hotel",
  "Oasis Palace",
];

const ROOM_TYPES = ["Standard Room", "Deluxe Room", "Executive Suite", "Family Room"];

const AMENITY_POOL = [
  "Free WiFi",
  "Breakfast included",
  "Pool",
  "Gym",
  "Airport shuttle",
  "Parking",
  "Spa",
];

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return function next() {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

export function searchMockHotels(params: HotelSearchParams): HotelResult[] {
  const { city, checkIn, checkOut } = params;
  const rand = seededRandom(`${city}-${checkIn}-${checkOut}`);

  const resultCount = 4 + Math.floor(rand() * 4);
  const results: HotelResult[] = [];

  const basePrice = 12000 + Math.floor(rand() * 20000);
  const isInternational = ["Dubai", "Doha", "Istanbul", "London"].includes(city);
  const cityBase = isInternational ? basePrice + 25000 : basePrice;

  for (let i = 0; i < resultCount; i++) {
    const starRating = 3 + Math.floor(rand() * 3); // 3-5 stars
    const priceJitter = 0.8 + rand() * 0.6;
    const netFarePerNight =
      Math.round((cityBase * (starRating / 4) * priceJitter) / 100) * 100;

    const amenities = AMENITY_POOL.filter(() => rand() > 0.5).slice(0, 5);
    if (amenities.length === 0) amenities.push("Free WiFi");

    results.push({
      id: `mock-hotel-${city}-${i}-${Math.round(rand() * 100000)}`,
      name: `${HOTEL_NAMES[Math.floor(rand() * HOTEL_NAMES.length)]} ${city}`,
      city,
      starRating,
      roomType: ROOM_TYPES[Math.floor(rand() * ROOM_TYPES.length)],
      netFarePerNight,
      currency: "PKR",
      amenities,
      freeCancellation: rand() > 0.4,
    });
  }

  return results.sort((a, b) => a.netFarePerNight - b.netFarePerNight);
}
