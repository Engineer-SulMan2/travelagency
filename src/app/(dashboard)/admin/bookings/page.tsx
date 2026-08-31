import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUnifiedBookings } from "@/lib/bookings-query";
import { BookingsTable } from "@/components/bookings/bookings-table";

export default async function AdminBookingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  const [bookings, agency] = await Promise.all([
    getUnifiedBookings({ agencyId: admin?.agencyId }),
    admin?.agencyId ? prisma.agency.findUnique({ where: { id: admin.agencyId }, select: { currency: true } }) : null,
  ]);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Bookings</h1>
      <p className="mb-6 text-sm text-slate-500">Every flight, hotel and package booking across your agency.</p>
      <BookingsTable bookings={bookings} showBookedBy currency={agency?.currency ?? "PKR"} />
    </div>
  );
}