export type ProductType = "FLIGHT" | "HOTEL" | "PACKAGE" | "VISA";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type BookingSummary = {
  id: string;
  type: ProductType;
  bookingRef: string;
  status: BookingStatus;
  title: string; // human-readable summary, e.g. "PIA PK101 · KHI → DXB"
  subtitle: string; // e.g. "12 Sep 2026" or "3 nights · 2 rooms"
  bookedBy: string; // agent/admin name — useful in the agency-wide admin view
  totalAmount: number;
  createdAt: string; // ISO

  // Raw date fields for the "Amend booking" flow (Phase 9). Flight/Package/Visa
  // carry a single amendable date; Hotel carries a check-in/check-out pair.
  amendableDate?: string; // YYYY-MM-DD
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD
};