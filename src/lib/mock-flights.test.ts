import { describe, it, expect } from "vitest";
import { searchMockFlights } from "./mock-flights";

const baseParams = {
  origin: "KHI",
  destination: "DXB",
  departureDate: "2026-09-15",
  passengers: 1,
  cabinClass: "ECONOMY" as const,
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
    expect(first.map((f) => f.segments[0].flightNumber))
      .toEqual(second.map((f) => f.segments[0].flightNumber));
  });

  it("produces different results for a different route", () => {
    const a = searchMockFlights(baseParams);
    const b = searchMockFlights({ ...baseParams, destination: "IST" });
    expect(a.map((f) => f.netFare)).not.toEqual(b.map((f) => f.netFare));
  });

  it("sorts results cheapest first", () => {
    const results = searchMockFlights(baseParams);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].netFare).toBeGreaterThanOrEqual(results[i - 1].netFare);
    }
  });

  it("only returns positive fares and valid seat counts", () => {
    const results = searchMockFlights(baseParams);
    for (const r of results) {
      expect(r.netFare).toBeGreaterThan(0);
      expect(r.seatsLeft).toBeGreaterThanOrEqual(1);
      expect(r.segments[0].origin).toBe(baseParams.origin);
      expect(r.segments[0].destination).toBe(baseParams.destination);
    }
  });

  it("prices business class higher than economy for the same route", () => {
    const economy = searchMockFlights(baseParams);
    const business = searchMockFlights({ ...baseParams, cabinClass: "BUSINESS" });
    const avg = (rows: typeof economy) => rows.reduce((s, r) => s + r.netFare, 0) / rows.length;
    expect(avg(business)).toBeGreaterThan(avg(economy));
  });
});
