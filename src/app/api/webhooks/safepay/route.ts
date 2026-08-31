import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordWalletTransaction } from "@/lib/wallet";
import { verifySafepayWebhook } from "@/lib/safepay";

// Safepay's source of truth for whether a top-up actually happened. The
// wallet is ONLY ever credited from here, never from the redirect back to
// our site — a closed tab, browser crash, or a shopper never returning at
// all still results in a correctly credited wallet as long as they paid.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("X-SFPY-SIGNATURE");

  if (!verifySafepayWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.type === "payment.succeeded") {
    const { tracker, amount, metadata } = event.data;
    const userId: string | undefined = metadata?.userId;
    const purpose: string | undefined = metadata?.purpose;

    if (userId && purpose === "WALLET_TOPUP") {
      // Idempotency: webhooks can be retried, so never credit the same
      // tracker twice.
      const existing = await prisma.walletTransaction.findFirst({
        where: { paymentReference: tracker },
      });

      if (!existing) {
        const amountPkr = Number(amount) / 100; // Safepay sends lowest denomination
        await prisma.$transaction(async (tx) => {
          await recordWalletTransaction(tx, {
            userId,
            type: "CREDIT",
            reason: "TOPUP",
            amount: amountPkr,
            paymentMethod: "CARD",
            paymentReference: tracker,
            description: "Wallet top-up via Safepay",
          });
        });
      }
    }
  }

  // payment.failed and other event types are acknowledged but need no
  // action — nothing was ever credited for them in the first place.
  return NextResponse.json({ received: true });
}