"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processMockPayment } from "@/lib/mock-payment-gateway";
import { recordWalletTransaction } from "@/lib/wallet";
import { logActivity } from "@/lib/activity-log";
import { isSafepayConfigured, createTopupCheckoutUrl } from "@/lib/safepay";
import { Role } from "@prisma/client";

export type WalletActionState = { error?: string; success?: boolean; message?: string; redirectUrl?: string };

// -------------------- Top-up (self-service, via payment gateway) --------------------

const topUpSchema = z.object({
  amount: z.coerce.number().min(500, "Minimum top-up is PKR 500").max(5_000_000),
  method: z.enum(["CARD", "JAZZCASH", "EASYPAISA"]),
});

export async function topUpWallet(
  _prevState: WalletActionState,
  formData: FormData
): Promise<WalletActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const parsed = topUpSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { amount, method } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };
  if (user.walletLocked) {
    return { error: "Your wallet is locked. Contact your agency admin to unlock it." };
  }

  // Real payment gateway configured — redirect to Safepay's hosted checkout.
  // The wallet is credited by the payment.succeeded webhook, NOT here, so a
  // closed tab or failed payment never results in a phantom top-up.
  if (isSafepayConfigured()) {
    const { url } = await createTopupCheckoutUrl(user.id, amount);
    return { success: true, redirectUrl: url };
  }

  const payment = await processMockPayment(method, amount);
  if (!payment.success) {
    return { error: payment.message };
  }

  await prisma.$transaction(async (tx) => {
    await recordWalletTransaction(tx, {
      userId: session.user.id,
      type: "CREDIT",
      reason: "TOPUP",
      amount,
      paymentMethod: method,
      paymentReference: payment.transactionId,
      description: `Wallet top-up via ${method}`,
    });
  });

  revalidatePath("/agent/wallet");
  revalidatePath("/admin/wallet");
  return { success: true, message: payment.message };
}

// -------------------- Manual adjustment (agency admin only) --------------------

const adjustSchema = z.object({
  userId: z.string().min(1),
  direction: z.enum(["CREDIT", "DEBIT"]),
  amount: z.coerce.number().min(1),
  note: z.string().min(2, "Add a short note explaining this adjustment"),
});

export async function adjustWallet(
  _prevState: WalletActionState,
  formData: FormData
): Promise<WalletActionState> {
  const session = await auth();
  if (!session || ![Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(session.user.role as Role)) {
    return { error: "Not authorized" };
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin) return { error: "Not authorized" };

  const parsed = adjustSchema.safeParse({
    userId: formData.get("userId"),
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { userId, direction, amount, note } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || (admin.role !== Role.SUPER_ADMIN && target.agencyId !== admin.agencyId)) {
    return { error: "Sub-agent not found" };
  }

  // Debits can take the wallet negative up to the sub-agent's credit limit.
  if (direction === "DEBIT" && Number(target.walletBalance) - amount < -Number(target.creditLimit)) {
    return { error: "This would exceed the sub-agent's credit limit" };
  }

  await prisma.$transaction(async (tx) => {
    await recordWalletTransaction(tx, {
      userId: target.id,
      type: direction,
      reason: "ADJUSTMENT",
      amount,
      description: `${note} (by ${admin.name})`,
    });

    await tx.notification.create({
      data: {
        userId: target.id,
        type: direction === "CREDIT" ? "COMMISSION_EARNED" : "SYSTEM",
        title: direction === "CREDIT" ? "Wallet credited" : "Wallet debited",
        message: `PKR ${amount.toLocaleString("en-PK")} ${direction === "CREDIT" ? "added to" : "deducted from"} your wallet: ${note}`,
        link: "/agent/wallet",
      },
    });

    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "WALLET_ADJUSTED",
      description: `${admin.name} ${direction === "CREDIT" ? "credited" : "debited"} PKR ${amount.toLocaleString("en-PK")} ${direction === "CREDIT" ? "to" : "from"} ${target.name}'s wallet — ${note}`,
    });
  });

  revalidatePath("/admin/wallet");
  revalidatePath("/admin/activity");
  return { success: true };
}