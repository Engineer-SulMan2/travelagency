// Parses "PT2H30M" style ISO 8601 durations (used by both Amadeus and
// Duffel) into total minutes.
export function parseIsoDurationToMinutes(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  const hours = match?.[1] ? parseInt(match[1], 10) : 0;
  const minutes = match?.[2] ? parseInt(match[2], 10) : 0;
  return hours * 60 + minutes;
}
