import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FlightBookingFlow } from "@/components/flights/flight-booking-flow";

export default async function AdminFlightsPage() {
  const session = await auth();
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  const markupPct = user ? Number(user.defaultMarkupPct) : 0;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Search flights</h1>
      <p className="mb-6 text-sm text-slate-500">
        Compare fares across airlines and book directly for your customer.
      </p>

      <FlightBookingFlow markupPct={markupPct} />
    </div>
  );
}