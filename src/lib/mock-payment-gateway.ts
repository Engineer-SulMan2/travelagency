import type { PaymentMethod, PaymentResult } from "@/types/payment";

// Stand-in for a real Stripe / JazzCash / EasyPaisa integration. Swap this
// out for real SDK calls once merchant credentials are available — the
// wallet top-up action only depends on the PaymentResult shape below, so
// nothing else needs to change.

function generateTransactionId(method: PaymentMethod) {
  const prefix = { CARD: "CH", JAZZCASH: "JC", EASYPAISA: "EP" }[method];
  return `${prefix}_${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
}

export async function processMockPayment(
  method: PaymentMethod,
  amount: number
): Promise<PaymentResult> {
  // Simulate gateway/network latency
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

  // ~3% simulated failure rate so the UI has a real failure path to handle
  const failed = Math.random() < 0.03;

  if (failed) {
    return {
      success: false,
      transactionId: generateTransactionId(method),
      message: "Payment declined by the provider. Please try again.",
    };
  }

  return {
    success: true,
    transactionId: generateTransactionId(method),
    message: `PKR ${amount.toLocaleString("en-PK")} received via ${method}.`,
  };
}
