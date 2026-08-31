import type {
  Prisma,
  WalletTransactionType,
  WalletTransactionReason,
  ProductType,
  PaymentMethod,
} from "@prisma/client";

type TxClient = Prisma.TransactionClient;

// Below this PKR balance, the sub-agent's agency admins get a one-time
// notification (fires only when balance crosses below the line, not on
// every transaction while it stays low).
const LOW_BALANCE_THRESHOLD = 5000;

export async function recordWalletTransaction(
  tx: TxClient,
  params: {
    userId: string;
    type: WalletTransactionType;
    reason: WalletTransactionReason;
    amount: number; // always positive; `type` gives the direction
    referenceType?: ProductType;
    referenceId?: string;
    paymentMethod?: PaymentMethod;
    paymentReference?: string;
    description?: string;
  }
) {
  const user = await tx.user.findUniqueOrThrow({ where: { id: params.userId } });
  const current = Number(user.walletBalance);
  const delta = params.type === "CREDIT" ? params.amount : -params.amount;
  const newBalance = current + delta;

  await tx.user.update({ where: { id: params.userId }, data: { walletBalance: newBalance } });

  await tx.walletTransaction.create({
    data: {
      userId: params.userId,
      type: params.type,
      reason: params.reason,
      amount: params.amount,
      balanceAfter: newBalance,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      paymentMethod: params.paymentMethod,
      paymentReference: params.paymentReference,
      description: params.description,
    },
  });

  if (
    user.role === "SUB_AGENT" &&
    user.agencyId &&
    newBalance < LOW_BALANCE_THRESHOLD &&
    current >= LOW_BALANCE_THRESHOLD
  ) {
    const admins = await tx.user.findMany({
      where: { agencyId: user.agencyId, role: { in: ["SUPER_ADMIN", "AGENCY_ADMIN"] } },
      select: { id: true },
    });
    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          type: "LOW_WALLET_BALANCE",
          title: "Low wallet balance",
          message: `${user.name}'s wallet balance dropped to PKR ${newBalance.toLocaleString("en-PK")}.`,
          link: "/admin/wallet",
        },
      });
    }
  }

  return newBalance;
}