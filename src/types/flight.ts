export type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

export type TripType = "ONE_WAY" | "ROUND_TRIP" | "MULTI_CITY";

export type FlightSegment = {
  airline: string;
  airlineCode: string;
  airlineLogoUrl?: string | null;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string; // ISO
  arrivalAt: string; // ISO
  durationMinutes: number;
};

// One leg of the journey (outbound, return, or one multi-city hop).
// segments.length: 1 = non-stop leg, 2+ = leg has a layover/connection.
export type FlightItinerary = {
  segments: FlightSegment[];
};

export type FlightResult = {
  id: string; // ephemeral id, only valid for this search response
  itineraries: FlightItinerary[]; // 1 = one-way, 2 = round-trip, 2+ = multi-city
  cabinClass: CabinClass;
  netFare: number; // cost price ("GDS" price) for ALL legs combined, PKR
  currency: "PKR";
  seatsLeft: number;
  refundable: boolean;
};

export type FlightSearchLeg = {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
};

export type FlightSearchParams = {
  tripType: TripType;
  legs: FlightSearchLeg[]; // 1 leg = one-way, 2 legs = round-trip, 2+ = multi-city
  passengers: number;
  cabinClass: CabinClass;
};