import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUnifiedBookings } from "@/lib/bookings-query";
import { BookingsTable } from "@/components/bookings/bookings-table";

export default async function AgentBookingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const [bookings, agency] = await Promise.all([
    getUnifiedBookings({ userId: session.user.id }),
    user?.agencyId ? prisma.agency.findUnique({ where: { id: user.agencyId }, select: { currency: true } }) : null,
  ]);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">My Bookings</h1>
      <p className="mb-6 text-sm text-slate-500">All your flight, hotel and package bookings.</p>
      <BookingsTable bookings={bookings} showBookedBy={false} currency={agency?.currency ?? "PKR"} />
    </div>
  );
}