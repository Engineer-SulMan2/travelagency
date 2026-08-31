export type PackageSummary = {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  inclusions: string[];
  basePrice: number;
  isActive: boolean;
  images: string[];
  maxSeats: number | null;
  remainingSeats: number | null; // null = unlimited
};