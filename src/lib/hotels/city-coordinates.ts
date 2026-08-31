// Duffel Stays searches by geographic coordinates + a radius, not a city
// code — so our plain city names (see src/lib/cities.ts) map to lat/long
// here instead of an IATA code (which was only needed for the now-dead
// Amadeus self-service hotel search).
export const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  Islamabad: { latitude: 33.6844, longitude: 73.0479 },
  Karachi: { latitude: 24.8607, longitude: 67.0011 },
  Lahore: { latitude: 31.5497, longitude: 74.3436 },
  Peshawar: { latitude: 34.0151, longitude: 71.5249 },
  Multan: { latitude: 30.1575, longitude: 71.5249 },
  Dubai: { latitude: 25.2048, longitude: 55.2708 },
  Doha: { latitude: 25.2854, longitude: 51.531 },
  Istanbul: { latitude: 41.0082, longitude: 28.9784 },
  London: { latitude: 51.5072, longitude: -0.1276 },
};