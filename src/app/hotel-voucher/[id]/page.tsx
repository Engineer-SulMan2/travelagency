import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { HotelVoucher } from "@/components/invoice/hotel-voucher";
import { PrintButton } from "@/components/invoice/print-button";

export default async function HotelVoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const booking = await prisma.hotelBooking.findUnique({
    where: { id },
    include: { guests: true, user: { include: { agency: true } } },
  });
  if (!booking) notFound();

  const isAdmin = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(session.user.role as Role);
  const authorized = booking.userId === session.user.id || (isAdmin && booking.agencyId === session.user.agencyId);
  if (!authorized) redirect("/login");

  if (booking.status === "CANCELLED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-500">This booking has been cancelled — no voucher available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto mb-6 flex max-w-2xl justify-end print:hidden">
        <PrintButton />
      </div>
      <HotelVoucher
        data={{
          bookingRef: booking.bookingRef,
          agencyName: booking.user.agency?.name ?? "Travel Agency SaaS",
          currency: booking.user.agency?.currency,
          stampUrl: booking.user.agency?.stampUrl,
          hotelName: booking.hotelName,
          city: booking.city,
          roomType: booking.roomType,
          checkIn: booking.checkIn.toISOString(),
          checkOut: booking.checkOut.toISOString(),
          nights: booking.nights,
          rooms: booking.rooms,
          guestNames: booking.guests.map((g) => `${g.title} ${g.firstName} ${g.lastName}`),
          totalAmount: Number(booking.totalAmount),
        }}
      />
    </div>
  );
}