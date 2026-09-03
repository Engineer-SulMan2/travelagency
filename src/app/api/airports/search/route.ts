import { NextRequest, NextResponse } from "next/server";

const DUFFEL_BASE = "https://api.duffel.com";

// Server-side proxy to Duffel's worldwide Places (airport/city) search —
// keeps DUFFEL_API_KEY off the client. Returns only airports (not city
// groupings) since search legs need a specific IATA airport/city code.
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.DUFFEL_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(
      `${DUFFEL_BASE}/places/suggestions?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Duffel-Version": "v2",
          Accept: "application/json",
        },
        // Airport/city data barely changes — safe to cache briefly.
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const json = await res.json();
    type DuffelPlace = {
      type: "airport" | "city";
      iata_code: string;
      name: string;
      city_name: string | null;
      iata_country_code: string;
    };

    const results = (json.data as DuffelPlace[])
      .filter((p) => p.type === "airport")
      .slice(0, 15)
      .map((p) => ({
        code: p.iata_code,
        name: p.name,
        city: p.city_name ?? p.name,
        country: p.iata_country_code,
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}