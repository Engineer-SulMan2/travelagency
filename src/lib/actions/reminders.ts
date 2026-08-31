"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type ReminderActionState = { error?: string; success?: boolean };

export type ReminderRow = {
  id: string;
  note: string;
  dueAt: string;
  completed: boolean;
  customerName: string | null;
  createdByName: string;
  isMine: boolean;
};

async function requireAgencyMember() {
  const session = await auth();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

const reminderSchema = z.object({
  customerId: z.string().optional(),
  note: z.string().min(2, "Note is too short").max(300),
  dueAt: z.string().min(1, "Due date is required"),
});

export async function createReminder(
  _prevState: ReminderActionState,
  formData: FormData
): Promise<ReminderActionState> {
  const user = await requireAgencyMember();
  if (!user) return { error: "Not authenticated" };

  const parsed = reminderSchema.safeParse({
    customerId: formData.get("customerId") || undefined,
    note: formData.get("note"),
    dueAt: formData.get("dueAt"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.reminder.create({
    data: {
      userId: user.id,
      agencyId: user.agencyId,
      customerId: parsed.data.customerId || null,
      note: parsed.data.note,
      dueAt: new Date(parsed.data.dueAt),
    },
  });

  revalidatePath("/agent/reminders");
  revalidatePath("/admin/reminders");
  return { success: true };
}

async function authorizeReminder(reminderId: string) {
  const user = await requireAgencyMember();
  if (!user) return { error: "Not authenticated" } as const;

  const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } });
  if (!reminder || reminder.agencyId !== user.agencyId) return { error: "Reminder not found" } as const;

  const isAdmin = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(user.role);
  if (!isAdmin && reminder.userId !== user.id) return { error: "Not authorized" } as const;

  return { reminder } as const;
}

export async function toggleReminderComplete(id: string): Promise<ReminderActionState> {
  const res = await authorizeReminder(id);
  if ("error" in res) return { error: res.error };

  await prisma.reminder.update({ where: { id }, data: { completed: !res.reminder.completed } });

  revalidatePath("/agent/reminders");
  revalidatePath("/admin/reminders");
  return { success: true };
}

export async function deleteReminder(id: string): Promise<ReminderActionState> {
  const res = await authorizeReminder(id);
  if ("error" in res) return { error: res.error };

  await prisma.reminder.delete({ where: { id } });

  revalidatePath("/agent/reminders");
  revalidatePath("/admin/reminders");
  return { success: true };
}

export async function getReminders(scope: "mine" | "agency"): Promise<ReminderRow[]> {
  const user = await requireAgencyMember();
  if (!user) return [];

  const isAdmin = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(user.role);
  const where =
    scope === "agency" && isAdmin ? { agencyId: user.agencyId } : { agencyId: user.agencyId, userId: user.id };

  const reminders = await prisma.reminder.findMany({
    where,
    orderBy: [{ completed: "asc" }, { dueAt: "asc" }],
    include: { customer: { select: { fullName: true } } },
  });

  const userIds = [...new Set(reminders.map((r) => r.userId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
  const nameMap = new Map(users.map((u) => [u.id, u.name]));

  return reminders.map((r) => ({
    id: r.id,
    note: r.note,
    dueAt: r.dueAt.toISOString(),
    completed: r.completed,
    customerName: r.customer?.fullName ?? null,
    createdByName: nameMap.get(r.userId) ?? "Unknown",
    isMine: r.userId === user.id,
  }));
}