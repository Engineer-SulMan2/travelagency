export type PaymentMethod = "CARD" | "JAZZCASH" | "EASYPAISA";

export type PaymentResult = {
  success: boolean;
  transactionId: string;
  message: string;
};
