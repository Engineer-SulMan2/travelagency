import { describe, it, expect } from "vitest";
import { computeMarkup, computeCommissionSplit, computeBookingPricing } from "./pricing";

describe("computeMarkup", () => {
  it("adds the markup percentage on top of net fare", () => {
    const { markupAmount, sellingFare } = computeMarkup(10000, 5);
    expect(markupAmount).toBe(500);
    expect(sellingFare).toBe(10500);
  });

  it("returns zero markup at 0%", () => {
    const { markupAmount, sellingFare } = computeMarkup(10000, 0);
    expect(markupAmount).toBe(0);
    expect(sellingFare).toBe(10000);
  });

  it("rounds to the nearest whole currency unit", () => {
    const { markupAmount } = computeMarkup(999, 3.33);
    expect(Number.isInteger(markupAmount)).toBe(true);
  });
});

describe("computeCommissionSplit", () => {
  it("splits markup between sub-agent commission and agency share", () => {
    const { commissionAmount, agencyShare } = computeCommissionSplit(1000, 70);
    expect(commissionAmount).toBe(700);
    expect(agencyShare).toBe(300);
  });

  it("gives the agency everything at 0% commission", () => {
    const { commissionAmount, agencyShare } = computeCommissionSplit(1000, 0);
    expect(commissionAmount).toBe(0);
    expect(agencyShare).toBe(1000);
  });

  it("commission + agency share always equals the total markup", () => {
    for (const [markup, pct] of [[1000, 33], [7777, 12.5], [1, 99]] as const) {
      const { commissionAmount, agencyShare } = computeCommissionSplit(markup, pct);
      expect(commissionAmount + agencyShare).toBe(markup);
    }
  });
});

describe("computeBookingPricing", () => {
  it("computes a full multi-passenger breakdown consistently", () => {
    // netFare 20000, markup 10%, commission 70%, 3 passengers
    const pricing = computeBookingPricing(20000, 10, 70, 3);

    expect(pricing.markupAmount).toBe(2000); // per unit
    expect(pricing.sellingFare).toBe(22000); // per unit
    expect(pricing.totalAmount).toBe(66000); // sellingFare * 3
    expect(pricing.netCost).toBe(60000); // netFare * 3
    expect(pricing.totalMarkup).toBe(6000); // markupAmount * 3
    expect(pricing.commissionAmount).toBe(4200); // 70% of totalMarkup
    expect(pricing.agencyShare).toBe(1800); // remaining 30%
  });

  it("totalAmount always equals netCost + totalMarkup", () => {
    const pricing = computeBookingPricing(15000, 8, 60, 2);
    expect(pricing.netCost + pricing.totalMarkup).toBe(pricing.totalAmount);
  });

  it("handles a single unit (quantity = 1) the same as computeMarkup", () => {
    const pricing = computeBookingPricing(5000, 12, 50, 1);
    const direct = computeMarkup(5000, 12);
    expect(pricing.markupAmount).toBe(direct.markupAmount);
    expect(pricing.totalAmount).toBe(direct.sellingFare);
  });
});
