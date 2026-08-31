import type { FlightResult, FlightSearchParams, FlightItinerary, CabinClass } from "@/types/flight";

// Stand-in for the real Amadeus/Duffel call. Deterministic-ish: same search
// params -> same "flights" (seeded by a simple hash) so results don't jump
// around during a demo, but different routes/dates still look distinct.
// Supports one-way, round-trip, and multi-city — one FlightResult per
// "offer" covers ALL requested legs, matching how Duffel/Amadeus price a
// multi-leg itinerary as a single combined fare.

const AIRLINES: { name: string; code: string }[] = [
  { name: "Pakistan International Airlines", code: "PK" },
  { name: "Airblue", code: "PA" },
  { name: "Fly Jinnah", code: "9P" },
  { name: "Emirates", code: "EK" },
  { name: "Qatar Airways", code: "QR" },
  { name: "Etihad Airways", code: "EY" },
];

const CABIN_MULTIPLIER: Record<CabinClass, number> = {
  ECONOMY: 1,
  PREMIUM_ECONOMY: 1.6,
  BUSINESS: 2.8,
  FIRST: 4.5,
};

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

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const LONG_HAUL_CODES = ["DXB", "DOH", "AUH", "JED", "LHR", "IST"];

function buildItinerary(
  origin: string,
  destination: string,
  departureDate: string,
  cabinClass: CabinClass,
  rand: () => number
): { itinerary: FlightItinerary; legFare: number } {
  const isLongHaul = LONG_HAUL_CODES.includes(destination) || LONG_HAUL_CODES.includes(origin);
  const basePrice = 18000 + Math.floor(rand() * 25000);
  const routeBase = isLongHaul ? basePrice + 60000 : basePrice;

  const airline = AIRLINES[Math.floor(rand() * AIRLINES.length)];
  const stops = rand() > 0.7 ? 1 : 0;
  const durationMinutes = (isLongHaul ? 210 : 75) + Math.floor(rand() * 90) + stops * 120;

  const depHour = 5 + Math.floor(rand() * 17);
  const depMinute = rand() > 0.5 ? 30 : 0;
  const departureAt = `${departureDate}T${pad(depHour)}:${pad(depMinute)}:00`;
  const arrival = new Date(departureAt);
  arrival.setMinutes(arrival.getMinutes() + durationMinutes);

  const priceJitter = 0.85 + rand() * 0.4;
  const legFare = Math.round((routeBase * CABIN_MULTIPLIER[cabinClass] * priceJitter) / 100) * 100;

  return {
    itinerary: {
      segments: [
        {
          airline: airline.name,
          airlineCode: airline.code,
          flightNumber: `${airline.code}${100 + Math.floor(rand() * 800)}`,
          origin,
          destination,
          departureAt,
          arrivalAt: arrival.toISOString(),
          durationMinutes,
        },
      ],
    },
    legFare,
  };
}

export function searchMockFlights(params: FlightSearchParams): FlightResult[] {
  const { legs, cabinClass } = params;
  const seed = legs.map((l) => `${l.origin}-${l.destination}-${l.departureDate}`).join("|") + `-${cabinClass}`;
  const rand = seededRandom(seed);

  const resultCount = 4 + Math.floor(rand() * 4); // 4-7 results
  const results: FlightResult[] = [];

  for (let i = 0; i < resultCount; i++) {
    let totalFare = 0;
    const itineraries: FlightItinerary[] = legs.map((leg) => {
      const { itinerary, legFare } = buildItinerary(leg.origin, leg.destination, leg.departureDate, cabinClass, rand);
      totalFare += legFare;
      return itinerary;
    });

    results.push({
      id: `mock-${legs[0].origin}${legs[0].destination}-${i}-${Math.round(rand() * 100000)}`,
      itineraries,
      cabinClass,
      netFare: totalFare,
      currency: "PKR",
      seatsLeft: 1 + Math.floor(rand() * 9),
      refundable: rand() > 0.5,
    });
  }

  return results.sort((a, b) => a.netFare - b.netFare);
}