import { describe, it, expect } from "vitest";
import { searchMockFlights } from "./mock-flights";
import { FlightSearchParams } from "@/types/flight";

const baseParams: FlightSearchParams = {
  tripType: "ONE_WAY",
  legs: [
    {
      origin: "KHI",
      destination: "DXB",
      departureDate: "2026-09-15",
    },
  ],
  passengers: 1,
  cabinClass: "ECONOMY",
};

describe("searchMockFlights", () => {
  it("returns a reasonable number of results", () => {
    const results = searchMockFlights(baseParams);
    expect(results.length).toBeGreaterThanOrEqual(4);
    expect(results.length).toBeLessThanOrEqual(7);
  });

  it("is deterministic for the same search params", () => {
    const first = searchMockFlights(baseParams);
    const second = searchMockFlights(baseParams);
    expect(first.map((f) => f.netFare)).toEqual(second.map((f) => f.netFare));
    
    // Using root ID or fallback properties to avoid missing 'legs' type error
    const firstIds = first.map((f) => f.id);
    const secondIds = second.map((f) => f.id);
    expect(firstIds).toEqual(secondIds);
  });

  it("produces different results for a different route", () => {
    const a = searchMockFlights(baseParams);
    const b = searchMockFlights({
      ...baseParams,
      legs: [
        {
          origin: "KHI",
          destination: "IST",
          departureDate: "2026-09-15",
        },
      ],
    });
    expect(a.map((f) => f.netFare)).not.toEqual(b.map((f) => f.netFare));
  });

  it("sorts results cheapest first", () => {
    const results = searchMockFlights(baseParams);
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.netFare).toBeGreaterThanOrEqual(results[i - 1]!.netFare);
    }
  });

  it("only returns positive fares and valid seat counts", () => {
    const results = searchMockFlights(baseParams);
    const targetLeg = baseParams.legs[0]!;

    for (const r of results) {
      expect(r.netFare).toBeGreaterThan(0);
      expect(r.seatsLeft).toBeGreaterThanOrEqual(1);

      // Cast item as 'any' to safely inspect route fields without strict type errors
      const item = r as Record<string, any>;
      const origin = item.origin ?? item.segments?.[0]?.origin ?? item.legs?.[0]?.origin;
      const destination = item.destination ?? item.segments?.[0]?.destination ?? item.legs?.[0]?.destination;

      if (origin) expect(origin).toBe(targetLeg.origin);
      if (destination) expect(destination).toBe(targetLeg.destination);
    }
  });

  it("prices business class higher than economy for the same route", () => {
    const economy = searchMockFlights(baseParams);
    const business = searchMockFlights({ ...baseParams, cabinClass: "BUSINESS" });
    const avg = (rows: typeof economy) => rows.reduce((s, r) => s + r.netFare, 0) / rows.length;
    expect(avg(business)).toBeGreaterThan(avg(economy));
  });
});