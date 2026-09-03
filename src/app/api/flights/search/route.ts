import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchFlights, getActiveFlightProvider } from "@/lib/flights/provider";
import type { CabinClass, FlightSearchLeg, TripType } from "@/types/flight";

const VALID_CABINS: CabinClass[] = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];
const VALID_TRIP_TYPES: TripType[] = ["ONE_WAY", "ROUND_TRIP", "MULTI_CITY"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const tripType: TripType = VALID_TRIP_TYPES.includes(body.tripType) ? body.tripType : "ONE_WAY";
  const legs: FlightSearchLeg[] = Array.isArray(body.legs) ? body.legs : [];
  const passengers = Number(body.passengers ?? 1);
  const cabinClassRaw = body.cabinClass ?? "ECONOMY";

  if (legs.length === 0) {
    return NextResponse.json({ error: "At least one leg is required" }, { status: 400 });
  }
  for (const leg of legs) {
    if (!leg.origin || !leg.destination || !leg.departureDate) {
      return NextResponse.json(
        { error: "Every leg needs an origin, destination and departure date" },
        { status: 400 }
      );
    }
    if (leg.origin === leg.destination) {
      return NextResponse.json({ error: "Origin and destination can't be the same" }, { status: 400 });
    }
  }
  if (tripType === "ONE_WAY" && legs.length !== 1) {
    return NextResponse.json({ error: "One-way trips need exactly one leg" }, { status: 400 });
  }
  if (tripType === "ROUND_TRIP" && legs.length !== 2) {
    return NextResponse.json({ error: "Round trips need exactly two legs" }, { status: 400 });
  }
  if (tripType === "MULTI_CITY" && legs.length < 2) {
    return NextResponse.json({ error: "Multi-city trips need at least two legs" }, { status: 400 });
  }

  const cabinClass = VALID_CABINS.includes(cabinClassRaw as CabinClass)
    ? (cabinClassRaw as CabinClass)
    : "ECONOMY";

  // Simulate network latency when on the mock provider; live providers have
  // their own real latency so no artificial delay is added for those.
  if (getActiveFlightProvider() === "mock") {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
  }

  let results;
  try {
    results = await searchFlights({
      tripType,
      legs,
      passengers: Number.isFinite(passengers) && passengers > 0 ? passengers : 1,
      cabinClass,
    });
  } catch (err) {
    // Surfaced directly in the response (not just server logs) so a
    // live-provider failure is immediately visible while testing.
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Flight search failed: ${message}` }, { status: 502 });
  }

  return NextResponse.json({ results });
}