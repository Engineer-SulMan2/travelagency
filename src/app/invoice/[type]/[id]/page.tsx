import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { InvoiceDocument, type InvoiceData } from "@/components/invoice/invoice-document";
import { PrintButton } from "@/components/invoice/print-button";

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN];

function dateStr(d: Date) {
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser) redirect("/login");
  const isAdmin = ADMIN_ROLES.includes(currentUser.role);

  function authorized(record: { userId: string; agencyId: string | null } | null) {
    if (!record) return false;
    if (record.userId === currentUser!.id) return true;
    if (isAdmin && record.agencyId === currentUser!.agencyId) return true;
    return false;
  }

  async function agencyInfo(agencyId: string | null) {
    if (!agencyId) {
      return {
        name: "Independent Agent",
        currency: "PKR",
        stampUrl: null as string | null,
        taxId: null as string | null,
        termsAndConditions: null as string | null,
        flightCancellationPolicy: null as string | null,
        hotelCancellationPolicy: null as string | null,
        packageCancellationPolicy: null as string | null,
        visaCancellationPolicy: null as string | null,
      };
    }
    const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
    return {
      name: agency?.name ?? "Travel Agency",
      currency: agency?.currency ?? "PKR",
      stampUrl: agency?.stampUrl ?? null,
      taxId: agency?.taxId ?? null,
      termsAndConditions: agency?.termsAndConditions ?? null,
      flightCancellationPolicy: agency?.flightCancellationPolicy ?? null,
      hotelCancellationPolicy: agency?.hotelCancellationPolicy ?? null,
      packageCancellationPolicy: agency?.packageCancellationPolicy ?? null,
      visaCancellationPolicy: agency?.visaCancellationPolicy ?? null,
    };
  }

  let data: InvoiceData | null = null;

  if (type === "flight") {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true, passengers: true },
    });
    if (!authorized(booking)) return notFound();
    if (!booking) return notFound();

    const agency = await agencyInfo(booking.agencyId);
    data = {
      bookingRef: booking.bookingRef,
      invoiceNumber: booking.invoiceNumber,
      typeLabel: "Flight",
      status: booking.status,
      issuedAt: dateStr(booking.createdAt),
      agencyName: agency.name,
      currency: agency.currency,
      taxId: agency.taxId,
      termsAndConditions: agency.termsAndConditions,
      stampUrl: agency.stampUrl,
      policyText: agency.flightCancellationPolicy,
      bookedBy: booking.user.name,
      travelerNames: booking.passengers.map((p) => `${p.title} ${p.firstName} ${p.lastName}`),
      lineItems: [
        {
          description: `${booking.airline} ${booking.flightNumber} (${booking.cabinClass}) — ${booking.origin} → ${booking.destination}`,
          qty: booking.passengers.length,
          unitPrice: Number(booking.sellingFare),
          amount: Number(booking.totalAmount),
        },
      ],
      totalAmount: Number(booking.totalAmount),
    };
  } else if (type === "hotel") {
    const booking = await prisma.hotelBooking.findUnique({
      where: { id },
      include: { user: true, guests: true },
    });
    if (!authorized(booking)) return notFound();
    if (!booking) return notFound();

    const agency = await agencyInfo(booking.agencyId);
    data = {
      bookingRef: booking.bookingRef,
      invoiceNumber: booking.invoiceNumber,
      typeLabel: "Hotel",
      status: booking.status,
      issuedAt: dateStr(booking.createdAt),
      agencyName: agency.name,
      currency: agency.currency,
      taxId: agency.taxId,
      termsAndConditions: agency.termsAndConditions,
      stampUrl: agency.stampUrl,
      policyText: agency.hotelCancellationPolicy,
      bookedBy: booking.user.name,
      travelerNames: booking.guests.map((g) => `${g.title} ${g.firstName} ${g.lastName}`),
      lineItems: [
        {
          description: `${booking.hotelName} — ${booking.roomType} (${dateStr(booking.checkIn)} → ${dateStr(booking.checkOut)})`,
          qty: booking.nights * booking.rooms,
          unitPrice: Number(booking.sellingFare),
          amount: Number(booking.totalAmount),
        },
      ],
      totalAmount: Number(booking.totalAmount),
    };
  } else if (type === "package") {
    const booking = await prisma.packageBooking.findUnique({
      where: { id },
      include: { user: true, package: true },
    });
    if (!authorized(booking)) return notFound();
    if (!booking) return notFound();

    const agency = await agencyInfo(booking.agencyId);
    data = {
      bookingRef: booking.bookingRef,
      invoiceNumber: booking.invoiceNumber,
      typeLabel: "Package",
      status: booking.status,
      issuedAt: dateStr(booking.createdAt),
      agencyName: agency.name,
      currency: agency.currency,
      taxId: agency.taxId,
      termsAndConditions: agency.termsAndConditions,
      stampUrl: agency.stampUrl,
      policyText: agency.packageCancellationPolicy,
      bookedBy: booking.user.name,
      travelerNames: [booking.leadTravelerName],
      lineItems: [
        {
          description: `${booking.package.title} — travel date ${dateStr(booking.travelDate)}`,
          qty: booking.travelers,
          unitPrice: Number(booking.sellingFare),
          amount: Number(booking.totalAmount),
        },
      ],
      totalAmount: Number(booking.totalAmount),
    };
  } else if (type === "visa") {
    const booking = await prisma.visaBooking.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!authorized(booking)) return notFound();
    if (!booking) return notFound();

    const agency = await agencyInfo(booking.agencyId);
    data = {
      bookingRef: booking.bookingRef,
      invoiceNumber: booking.invoiceNumber,
      typeLabel: "Visa",
      status: booking.status,
      issuedAt: dateStr(booking.createdAt),
      agencyName: agency.name,
      currency: agency.currency,
      taxId: agency.taxId,
      termsAndConditions: agency.termsAndConditions,
      stampUrl: agency.stampUrl,
      policyText: agency.visaCancellationPolicy,
      bookedBy: booking.user.name,
      travelerNames: [booking.leadApplicantName],
      lineItems: [
        {
          description: `${booking.destinationCountry} — ${booking.visaType} visa (travel date ${dateStr(booking.travelDate)})`,
          qty: booking.applicants,
          unitPrice: Number(booking.sellingFare),
          amount: Number(booking.totalAmount),
        },
      ],
      totalAmount: Number(booking.totalAmount),
    };
  } else {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto mb-4 flex max-w-2xl justify-end">
        <PrintButton />
      </div>
      <InvoiceDocument data={data} />
    </div>
  );
}