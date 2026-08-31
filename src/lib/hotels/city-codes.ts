// Amadeus hotel search needs an IATA city code, but our search UI works
// with plain city names (see src/lib/cities.ts). This is the mapping.
export const CITY_IATA_CODES: Record<string, string> = {
  Islamabad: "ISB",
  Karachi: "KHI",
  Lahore: "LHE",
  Peshawar: "PEW",
  Multan: "MUX",
  Dubai: "DXB",
  Doha: "DOH",
  Istanbul: "IST",
  London: "LON",
};
