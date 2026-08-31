import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VisaBookingForm } from "@/components/visa/visa-booking-form";

export default async function AdminVisaPage() {
  const session = await auth();
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Visa Bookings</h1>
      <p className="mb-6 text-sm text-slate-500">
        Request visa processing for a customer — fee is calculated per applicant.
      </p>
      <VisaBookingForm markupPct={user ? Number(user.defaultMarkupPct) : 0} />
    </div>
  );
}
