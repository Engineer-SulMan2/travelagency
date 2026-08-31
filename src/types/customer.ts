export type CustomerSummary = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  passportNumber: string | null;
  notes: string | null;
  tags: string[];
  loyaltyPoints: number;
  createdAt: string;
};