import { describe, it, expect } from "vitest";
import { searchMockHotels } from "./mock-hotels";

const baseParams = {
  city: "Islamabad",
  checkIn: "2026-09-20",
  checkOut: "2026-09-22",
  rooms: 1,
};

describe("searchMockHotels", () => {
  it("returns a reasonable number of results", () => {
    const results = searchMockHotels(baseParams);
    expect(results.length).toBeGreaterThanOrEqual(4);
    expect(results.length).toBeLessThanOrEqual(7);
  });

  it("is deterministic for the same search params", () => {
    const first = searchMockHotels(baseParams);
    const second = searchMockHotels(baseParams);
    expect(first.map((h) => h.netFarePerNight)).toEqual(second.map((h) => h.netFarePerNight));
  });

  it("sorts results cheapest first", () => {
    const results = searchMockHotels(baseParams);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].netFarePerNight).toBeGreaterThanOrEqual(results[i - 1].netFarePerNight);
    }
  });

  it("only returns valid star ratings and positive rates", () => {
    const results = searchMockHotels(baseParams);
    for (const h of results) {
      expect(h.starRating).toBeGreaterThanOrEqual(3);
      expect(h.starRating).toBeLessThanOrEqual(5);
      expect(h.netFarePerNight).toBeGreaterThan(0);
      expect(h.city).toBe(baseParams.city);
      expect(h.amenities.length).toBeGreaterThan(0);
    }
  });

  it("prices international cities higher on average than domestic ones", () => {
    const domestic = searchMockHotels(baseParams);
    const international = searchMockHotels({ ...baseParams, city: "Dubai" });
    const avg = (rows: typeof domestic) =>
      rows.reduce((s, r) => s + r.netFarePerNight, 0) / rows.length;
    expect(avg(international)).toBeGreaterThan(avg(domestic));
  });
});
