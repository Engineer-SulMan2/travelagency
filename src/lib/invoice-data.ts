import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { generateVerifyQrDataUrl } from "@/lib/qr";
import type { InvoiceData } from "@/components/invoice/invoice-document";

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN];

function dateStr(d: Date) {
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
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

// Shared by the single-invoice page and the bulk-export page — one place
// for the per-type fetch + authorization + InvoiceData shaping logic.
export async function getInvoiceData(
  type: string,
  id: string,
  currentUser: { id: string; role: Role; agencyId: string | null }
): Promise<InvoiceData | null> {
  const isAdmin = ADMIN_ROLES.includes(currentUser.role);

  function authorized(record: { userId: string; agencyId: string | null } | null) {
    if (!record) return false;
    if (record.userId === currentUser.id) return true;
    if (isAdmin && record.agencyId === currentUser.agencyId) return true;
    return false;
  }

  if (type === "flight") {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true, passengers: true, additionalLegs: { orderBy: { legOrder: "asc" } } },
    });
    if (!booking || !authorized(booking)) return null;

    const agency = await agencyInfo(booking.agencyId);
    const tripTypeLabel =
      booking.tripType === "ROUND_TRIP" ? " (Return)" : booking.tripType === "MULTI_CITY" ? " (Multi-city)" : "";
    return {
      bookingRef: booking.bookingRef,
      invoiceNumber: booking.invoiceNumber,
      typeLabel: `Flight${tripTypeLabel}`,
      status: booking.status,
      issuedAt: dateStr(booking.createdAt),
      agencyName: agency.name,
      currency: agency.currency,
      taxId: agency.taxId,
      termsAndConditions: agency.termsAndConditions,
      stampUrl: agency.stampUrl,
      policyText: agency.flightCancellationPolicy,
      qrCodeUrl: await generateVerifyQrDataUrl(booking.bookingRef),
      bookedBy: booking.user.name,
      travelerNames: booking.passengers.map((p) => `${p.title} ${p.firstName} ${p.lastName}`),
      lineItems: [
        {
          description: `${booking.airline} ${booking.flightNumber} (${booking.cabinClass}) — ${booking.origin} → ${booking.destination}`,
          qty: booking.passengers.length,
          unitPrice: Number(booking.sellingFare),
          amount: Number(booking.totalAmount) / (booking.additionalLegs.length + 1),
        },
        ...booking.additionalLegs.map((leg) => ({
          description: `${leg.airline} ${leg.flightNumber} (${booking.cabinClass}) — ${leg.origin} → ${leg.destination}`,
          qty: booking.passengers.length,
          unitPrice: Number(booking.sellingFare),
          amount: Number(booking.totalAmount) / (booking.additionalLegs.length + 1),
        })),
      ],
      totalAmount: Number(booking.totalAmount),
    };
  }

  if (type === "hotel") {
    const booking = await prisma.hotelBooking.findUnique({
      where: { id },
      include: { user: true, guests: true },
    });
    if (!booking || !authorized(booking)) return null;

    const agency = await agencyInfo(booking.agencyId);
    return {
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
      qrCodeUrl: await generateVerifyQrDataUrl(booking.bookingRef),
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
  }

  if (type === "package") {
    const booking = await prisma.packageBooking.findUnique({
      where: { id },
      include: { user: true, package: true },
    });
    if (!booking || !authorized(booking)) return null;

    const agency = await agencyInfo(booking.agencyId);
    return {
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
      qrCodeUrl: await generateVerifyQrDataUrl(booking.bookingRef),
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
  }

  if (type === "visa") {
    const booking = await prisma.visaBooking.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!booking || !authorized(booking)) return null;

    const agency = await agencyInfo(booking.agencyId);
    return {
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
      qrCodeUrl: await generateVerifyQrDataUrl(booking.bookingRef),
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
  }

  return null;
}