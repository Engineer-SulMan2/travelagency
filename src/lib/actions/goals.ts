"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type GoalActionState = { error?: string; success?: boolean };

export type GoalProgress = {
  targetAmount: number | null;
  monthRevenue: number;
};

const goalSchema = z.object({
  targetAmount: z.coerce.number().min(1, "Target must be greater than 0"),
});

export async function setMyGoal(
  _prevState: GoalActionState,
  formData: FormData
): Promise<GoalActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const parsed = goalSchema.safeParse({ targetAmount: formData.get("targetAmount") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.goal.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, targetAmount: parsed.data.targetAmount },
    update: { targetAmount: parsed.data.targetAmount },
  });

  revalidatePath("/agent");
  return { success: true };
}

export async function getMyGoalProgress(userId: string): Promise<GoalProgress> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [goal, flightSum, hotelSum, pkgSum, visaSum] = await Promise.all([
    prisma.goal.findUnique({ where: { userId } }),
    prisma.booking.aggregate({
      where: { userId, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.hotelBooking.aggregate({
      where: { userId, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.packageBooking.aggregate({
      where: { userId, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.visaBooking.aggregate({
      where: { userId, status: { not: "CANCELLED" }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
  ]);

  const monthRevenue =
    Number(flightSum._sum.totalAmount ?? 0) +
    Number(hotelSum._sum.totalAmount ?? 0) +
    Number(pkgSum._sum.totalAmount ?? 0) +
    Number(visaSum._sum.totalAmount ?? 0);

  return { targetAmount: goal ? Number(goal.targetAmount) : null, monthRevenue };
}