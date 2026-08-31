import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchHotels, getActiveHotelProvider } from "@/lib/hotels/provider";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const rooms = Number(searchParams.get("rooms") ?? "1");

  if (!city || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: "city, checkIn and checkOut are required" },
      { status: 400 }
    );
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    return NextResponse.json(
      { error: "Check-out must be after check-in" },
      { status: 400 }
    );
  }

  if (getActiveHotelProvider() === "mock") {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
  }

  const results = await searchHotels({
    city,
    checkIn,
    checkOut,
    rooms: Number.isFinite(rooms) && rooms > 0 ? rooms : 1,
  });

  return NextResponse.json({ results });
}
