import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HotelBookingFlow } from "@/components/hotels/hotel-booking-flow";

export default async function AdminHotelsPage() {
  const session = await auth();
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  const markupPct = user ? Number(user.defaultMarkupPct) : 0;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Search hotels</h1>
      <p className="mb-6 text-sm text-slate-500">Mock results — same pattern as flights.</p>
      <HotelBookingFlow markupPct={markupPct} />
    </div>
  );
}
