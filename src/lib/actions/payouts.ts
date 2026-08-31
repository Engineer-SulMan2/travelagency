"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordWalletTransaction } from "@/lib/wallet";
import { logActivity } from "@/lib/activity-log";
import { Role } from "@prisma/client";

export type PayoutState = { error?: string; success?: boolean };

const schema = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});

export async function createPayoutBatch(
  _prevState: PayoutState,
  formData: FormData
): Promise<PayoutState> {
  const session = await auth();
  if (!session || ![Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(session.user.role as Role)) {
    return { error: "Not authorized" };
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin?.agencyId) return { error: "No agency associated with this account" };

  const parsed = schema.safeParse({
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
  });
  if (!parsed.success) return { error: "Invalid dates" };

  const periodStart = new Date(`${parsed.data.periodStart}T00:00:00`);
  const periodEnd = new Date(`${parsed.data.periodEnd}T23:59:59`);

  if (periodEnd <= periodStart) return { error: "End date must be after start date" };

  const grouped = await prisma.commissionEntry.groupBy({
    by: ["userId"],
    where: {
      agencyId: admin.agencyId,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    _sum: { commissionAmount: true },
  });

  const payable = grouped.filter((e) => Number(e._sum.commissionAmount ?? 0) > 0);

  if (payable.length === 0) {
    return { error: "No commission was earned by any sub-agent in this period" };
  }

  const totalAmount = payable.reduce((sum, e) => sum + Number(e._sum.commissionAmount ?? 0), 0);

  await prisma.$transaction(async (tx) => {
    const batch = await tx.payoutBatch.create({
      data: {
        agencyId: admin.agencyId,
        createdById: admin.id,
        periodStart,
        periodEnd,
        totalAmount,
      },
    });

    for (const entry of payable) {
      const amount = Number(entry._sum.commissionAmount ?? 0);

      await tx.payoutEntry.create({
        data: { batchId: batch.id, userId: entry.userId, commissionAmount: amount },
      });

      await recordWalletTransaction(tx, {
        userId: entry.userId,
        type: "DEBIT",
        reason: "ADJUSTMENT",
        amount,
        description: `Commission payout settled for ${parsed.data.periodStart} to ${parsed.data.periodEnd}`,
      });

      await tx.notification.create({
        data: {
          userId: entry.userId,
          type: "COMMISSION_EARNED",
          title: "Commission paid out",
          message: `PKR ${amount.toLocaleString("en-PK")} in commission has been settled for ${parsed.data.periodStart} to ${parsed.data.periodEnd}.`,
          link: "/agent/wallet",
        },
      });
    }

    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "PAYOUT_BATCH_CREATED",
      description: `${admin.name} created a payout batch settling PKR ${totalAmount.toLocaleString("en-PK")} across ${payable.length} sub-agent(s)`,
    });
  });

  revalidatePath("/admin/payouts");
  revalidatePath("/admin/activity");
  return { success: true };
}