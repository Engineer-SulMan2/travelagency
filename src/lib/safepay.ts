import Safepay from "@sfpy/node-core";
import { headers } from "next/headers";
import crypto from "crypto";

// Real payment gateway for Pakistan (getsafepay.com) — handles Cards
// directly, and JazzCash/EasyPaisa once enabled on the merchant account.
// Docs: https://safepay-docs.netlify.app/build-your-integration/express-checkout
//
// Requires SAFEPAY_SECRET_KEY (secret) and SAFEPAY_API_KEY (merchant_api_key,
// public) from the Safepay dashboard. Sandbox keys work immediately with no
// business verification — production keys need Safepay's KYC process first.
// If neither is set, wallet top-up falls back to the mock gateway so the
// app keeps working in a pure-demo setup.

export function isSafepayConfigured(): boolean {
  return Boolean(process.env.SAFEPAY_SECRET_KEY && process.env.SAFEPAY_API_KEY);
}

function getEnv(): "sandbox" | "production" {
  return process.env.SAFEPAY_ENV === "production" ? "production" : "sandbox";
}

function getClient() {
  const env = getEnv();
  return new Safepay(process.env.SAFEPAY_SECRET_KEY ?? "", {
    authType: "secret",
    host: env === "production" ? "https://api.getsafepay.com" : "https://sandbox.api.getsafepay.com",
  });
}

async function getAppOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Creates a Safepay checkout session for a wallet top-up and returns the
// URL to redirect the sub-agent to. The wallet is NOT credited here — only
// the webhook (payment.succeeded) credits it, so a user closing the tab
// mid-payment never results in a phantom credit.
export async function createTopupCheckoutUrl(
  userId: string,
  amountPkr: number
): Promise<{ url: string; tracker: string }> {
  const safepay = getClient();
  const origin = await getAppOrigin();

  const session = await safepay.payments.session.setup({
    merchant_api_key: process.env.SAFEPAY_API_KEY ?? "",
    intent: "CYBERSOURCE",
    mode: "payment",
    entry_mode: "raw",
    currency: "PKR",
    amount: Math.round(amountPkr * 100), // lowest denomination
    metadata: { userId, purpose: "WALLET_TOPUP" },
  });

  const tracker: string = session.data.tracker.token;

  // Fix: Safepay SDK exposes `passport.create()` directly on the instance (or fallback via any)
  const passportClient = (safepay as any).passport || (safepay as any).auth?.passport;
  const authResponse = await passportClient.create();
  const tbt: string = authResponse.data;

  const checkoutUrl = safepay.checkouts.payment.create({
    tracker,
    tbt,
    environment: getEnv(),
    source: "hosted",
    redirect_url: `${origin}/agent/wallet?topup=success&tracker=${tracker}`,
    cancel_url: `${origin}/agent/wallet?topup=cancelled`,
  });

  return { url: checkoutUrl, tracker };
}

// Verifies the X-SFPY-SIGNATURE header on an incoming webhook. Uses
// HMAC-SHA512 over the raw JSON body with the dashboard-provided shared
// secret — see https://safepay-docs.netlify.app/developers/webhooks/verify-hmac-signatures
export function verifySafepayWebhook(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.SAFEPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac("sha512", process.env.SAFEPAY_WEBHOOK_SECRET)
    .update(Buffer.from(rawBody))
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false; // length mismatch etc. — treat as invalid, not a crash
  }
}