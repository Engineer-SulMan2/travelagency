import { getInvoiceData } from "@/lib/invoice-data";
import type { Role } from "@prisma/client";

export type TripSummaryData = {
  bookingRef: string;
  typeLabel: string;
  status: string;
  agencyName: string;
  description: string;
  travelerNames: string[];
  bookedBy: string;
};

// A friendly, customer-facing version of the invoice — same underlying
// booking data, but with every dollar figure stripped out. Meant to be
// handed to the traveler directly, not filed for accounting.
export async function getTripSummaryData(
  type: string,
  id: string,
  currentUser: { id: string; role: Role; agencyId: string | null }
): Promise<TripSummaryData | null> {
  const invoice = await getInvoiceData(type, id, currentUser);
  if (!invoice) return null;

  return {
    bookingRef: invoice.bookingRef,
    typeLabel: invoice.typeLabel,
    status: invoice.status,
    agencyName: invoice.agencyName,
    description: invoice.lineItems[0]?.description ?? "",
    travelerNames: invoice.travelerNames,
    bookedBy: invoice.bookedBy,
  };
}