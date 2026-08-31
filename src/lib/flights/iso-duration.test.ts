import { describe, it, expect } from "vitest";
import { parseIsoDurationToMinutes } from "./iso-duration";

describe("parseIsoDurationToMinutes", () => {
  it("parses hours and minutes", () => {
    expect(parseIsoDurationToMinutes("PT2H30M")).toBe(150);
  });

  it("parses hours only", () => {
    expect(parseIsoDurationToMinutes("PT5H")).toBe(300);
  });

  it("parses minutes only", () => {
    expect(parseIsoDurationToMinutes("PT45M")).toBe(45);
  });

  it("returns 0 for an empty/zero duration", () => {
    expect(parseIsoDurationToMinutes("PT0M")).toBe(0);
  });

  it("handles a long-haul style duration", () => {
    expect(parseIsoDurationToMinutes("PT14H55M")).toBe(895);
  });
});
