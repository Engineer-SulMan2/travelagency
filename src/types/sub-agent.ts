export type SubAgentRow = {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  defaultMarkupPct: number;
  commissionPct: number;
  creditLimit: number;
  walletBalance: number;
  walletLocked: boolean;
  bookingCount: number;
  totalCommissionEarned: number;
};