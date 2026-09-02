import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { BoardingPass } from "@/components/invoice/boarding-pass";
import { PrintButton } from "@/components/invoice/print-button";
import { generateVerifyQrDataUrl } from "@/lib/qr";

function seatFor(index: number) {
  const rows = [12, 14, 16, 18, 20, 22, 24];
  const letters = ["A", "B", "C", "D", "E", "F"];
  const row = rows[index % rows.length];
  const letter = letters[index % letters.length];
  return `${row}${letter}`;
}

function gateFor(flightNumber: string) {
  let hash = 0;
  for (const ch of flightNumber) hash = (hash * 31 + ch.charCodeAt(0)) % 26;
  return `${String.fromCharCode(65 + (hash % 6))}${(hash % 20) + 1}`;
}

export default async function BoardingPassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { passengers: true, user: { include: { agency: true } }, additionalLegs: { orderBy: { legOrder: "asc" } } },
  });

  if (!booking) notFound();

  const isAdmin = ([Role.SUPER_ADMIN, Role.AGENCY_ADMIN] as Role[]).includes(session.user.role as Role);
  const authorized = booking.userId === session.user.id || (isAdmin && booking.agencyId === session.user.agencyId);
  if (!authorized) redirect("/login");

  if (booking.status === "CANCELLED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-500">This booking has been cancelled — no boarding pass available.</p>
      </div>
    );
  }

  const qrCodeUrl = await generateVerifyQrDataUrl(booking.bookingRef);

  const legs = [
    {
      airline: booking.airline,
      flightNumber: booking.flightNumber,
      origin: booking.origin,
      destination: booking.destination,
      departureAt: booking.departureAt,
      label: booking.additionalLegs.length > 0 ? "Outbound" : null,
    },
    ...booking.additionalLegs.map((leg, i) => ({
      airline: leg.airline,
      flightNumber: leg.flightNumber,
      origin: leg.origin,
      destination: leg.destination,
      departureAt: leg.departureAt,
      label: booking.additionalLegs.length === 1 ? "Return" : `Leg ${i + 2}`,
    })),
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto mb-6 flex max-w-2xl justify-end print:hidden">
        <PrintButton />
      </div>
      <div className="space-y-4">
        {legs.map((leg, legIndex) => (
          <div key={legIndex}>
            {leg.label && (
              <p className="mx-auto mb-2 max-w-2xl text-xs font-medium uppercase tracking-wide text-indigo-500">
                {leg.label}
              </p>
            )}
            <div className="space-y-4">
              {booking.passengers.map((p, i) => (
                <BoardingPass
                  key={`${legIndex}-${p.id}`}
                  data={{
                    bookingRef: booking.bookingRef,
                    agencyName: booking.user.agency?.name ?? "Travel Agency SaaS",
                    airline: leg.airline,
                    flightNumber: leg.flightNumber,
                    origin: leg.origin,
                    destination: leg.destination,
                    departureAt: leg.departureAt.toISOString(),
                    cabinClass: booking.cabinClass,
                    passengerName: `${p.title} ${p.firstName} ${p.lastName}`,
                    seat: seatFor(i + legIndex),
                    gate: gateFor(leg.flightNumber),
                    qrCodeUrl,
                    boardingTime: new Date(leg.departureAt.getTime() - 45 * 60 * 1000).toLocaleTimeString("en-PK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}