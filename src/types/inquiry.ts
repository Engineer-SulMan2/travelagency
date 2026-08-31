export type InquirySummary = {
  id: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  productType: string | null;
  details: string;
  status: "OPEN" | "CONTACTED" | "CONVERTED" | "CLOSED";
  createdBy: string;
  createdAt: string;
};