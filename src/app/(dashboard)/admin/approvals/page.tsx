import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUnifiedBookings } from "@/lib/bookings-query";
import { ApprovalsTable } from "@/components/approvals/approvals-table";

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin) redirect("/login");

  const [bookings, agency] = await Promise.all([
    getUnifiedBookings({ agencyId: admin.agencyId }),
    admin.agencyId ? prisma.agency.findUnique({ where: { id: admin.agencyId }, select: { currency: true } }) : null,
  ]);
  const pending = bookings.filter((b) => b.status === "PENDING");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Approvals</h1>
      <p className="mb-6 text-sm text-slate-500">
        Bookings above your agency&apos;s approval threshold wait here until you sign off.
      </p>
      <ApprovalsTable bookings={pending} currency={agency?.currency ?? "PKR"} />
    </div>
  );
}