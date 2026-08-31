"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { Role, UserStatus } from "@prisma/client";

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN];

async function requireAgencyAdmin() {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role as Role)) {
    throw new Error("Not authorized");
  }
  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin) throw new Error("Not authorized");
  return admin;
}

// -------------------- Create sub-agent --------------------

const createSubAgentSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  markupPct: z.coerce.number().min(0).max(100),
  commissionPct: z.coerce.number().min(0).max(100),
  creditLimit: z.coerce.number().min(0).default(0),
});

export type SubAgentFormState = { error?: string; success?: boolean };

export async function createSubAgent(
  _prevState: SubAgentFormState,
  formData: FormData
): Promise<SubAgentFormState> {
  const admin = await requireAgencyAdmin();

  const parsed = createSubAgentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    markupPct: formData.get("markupPct"),
    commissionPct: formData.get("commissionPct"),
    creditLimit: formData.get("creditLimit") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, markupPct, commissionPct, creditLimit } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.SUB_AGENT,
        agencyId: admin.agencyId,
        parentId: admin.id,
        defaultMarkupPct: markupPct,
        commissionPct,
        creditLimit,
      },
    });

    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "SUB_AGENT_CREATED",
      description: `${admin.name} added sub-agent ${name} (${email})`,
    });
  });

  revalidatePath("/admin/sub-agents");
  revalidatePath("/admin/activity");
  return { success: true };
}

// -------------------- Update markup / commission --------------------

const updateSettingsSchema = z.object({
  userId: z.string().min(1),
  markupPct: z.coerce.number().min(0).max(100),
  commissionPct: z.coerce.number().min(0).max(100),
  creditLimit: z.coerce.number().min(0),
});

export async function updateSubAgentSettings(input: {
  userId: string;
  markupPct: number;
  commissionPct: number;
  creditLimit: number;
}): Promise<SubAgentFormState> {
  const admin = await requireAgencyAdmin();
  const parsed = updateSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!target || (admin.role !== Role.SUPER_ADMIN && target.agencyId !== admin.agencyId)) {
    return { error: "Sub-agent not found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: {
        defaultMarkupPct: parsed.data.markupPct,
        commissionPct: parsed.data.commissionPct,
        creditLimit: parsed.data.creditLimit,
      },
    });

    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "SUB_AGENT_MARKUP_UPDATED",
      description: `${admin.name} updated ${target.name}'s rate: markup ${Number(target.defaultMarkupPct)}% → ${parsed.data.markupPct}%, commission ${Number(target.commissionPct)}% → ${parsed.data.commissionPct}%, credit limit PKR ${Number(target.creditLimit).toLocaleString("en-PK")} → PKR ${parsed.data.creditLimit.toLocaleString("en-PK")}`,
    });
  });

  revalidatePath("/admin/sub-agents");
  revalidatePath("/admin/markup");
  revalidatePath("/admin/activity");
  return { success: true };
}

// -------------------- Suspend / activate --------------------

export async function toggleSubAgentStatus(userId: string): Promise<SubAgentFormState> {
  const admin = await requireAgencyAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || (admin.role !== Role.SUPER_ADMIN && target.agencyId !== admin.agencyId)) {
    return { error: "Sub-agent not found" };
  }

  const nextStatus = target.status === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: { status: nextStatus },
    });

    await tx.notification.create({
      data: {
        userId: target.id,
        type: "SUB_AGENT_STATUS_CHANGED",
        title: nextStatus === "SUSPENDED" ? "Account suspended" : "Account reactivated",
        message:
          nextStatus === "SUSPENDED"
            ? "Your account has been suspended by your agency admin."
            : "Your account has been reactivated.",
      },
    });

    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "SUB_AGENT_STATUS_CHANGED",
      description: `${admin.name} ${nextStatus === "SUSPENDED" ? "suspended" : "activated"} ${target.name}`,
    });
  });

  revalidatePath("/admin/sub-agents");
  revalidatePath("/admin/activity");
  return { success: true };
}

// -------------------- Wallet lock --------------------
// Freezes bookings and top-ups for this sub-agent without touching their
// account status — they can still log in and browse, just not spend or
// add money. Admin-initiated adjustments/refunds are unaffected.

export async function toggleWalletLock(userId: string): Promise<SubAgentFormState> {
  const admin = await requireAgencyAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || (admin.role !== Role.SUPER_ADMIN && target.agencyId !== admin.agencyId)) {
    return { error: "Sub-agent not found" };
  }

  const nextLocked = !target.walletLocked;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: target.id }, data: { walletLocked: nextLocked } });

    await tx.notification.create({
      data: {
        userId: target.id,
        type: "SYSTEM",
        title: nextLocked ? "Wallet locked" : "Wallet unlocked",
        message: nextLocked
          ? "Your agency admin has locked your wallet. You can't make new bookings or top up until it's unlocked."
          : "Your wallet has been unlocked. You can make bookings and top up again.",
        link: "/agent/wallet",
      },
    });

    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "SUB_AGENT_STATUS_CHANGED",
      description: `${admin.name} ${nextLocked ? "locked" : "unlocked"} ${target.name}'s wallet`,
    });
  });

  revalidatePath("/admin/sub-agents");
  revalidatePath("/admin/activity");
  return { success: true };
}

// -------------------- Agency-wide default markup --------------------

const agencyMarkupSchema = z.object({
  defaultMarkupPct: z.coerce.number().min(0).max(100),
});

export async function updateAgencyDefaultMarkup(
  _prevState: SubAgentFormState,
  formData: FormData
): Promise<SubAgentFormState> {
  const admin = await requireAgencyAdmin();
  if (!admin.agencyId) return { error: "No agency associated with this account" };

  const parsed = agencyMarkupSchema.safeParse({
    defaultMarkupPct: formData.get("defaultMarkupPct"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: admin.agencyId! },
      data: { defaultMarkupPct: parsed.data.defaultMarkupPct },
    });

    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "AGENCY_MARKUP_UPDATED",
      description: `${admin.name} updated the agency default markup to ${parsed.data.defaultMarkupPct}%`,
    });
  });

  revalidatePath("/admin/markup");
  revalidatePath("/admin/activity");
  return { success: true };
}

// -------------------- Permanent delete (Agency Admin) --------------------
// Irreversible — unlike suspend, there's no way back once this runs.

export async function deleteSubAgent(userId: string): Promise<SubAgentFormState> {
  const admin = await requireAgencyAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (
    !target ||
    target.role !== Role.SUB_AGENT ||
    (admin.role !== Role.SUPER_ADMIN && target.agencyId !== admin.agencyId)
  ) {
    return { error: "Sub-agent not found" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await logActivity(tx, {
        actorId: admin.id,
        agencyId: admin.agencyId,
        action: "SUB_AGENT_STATUS_CHANGED",
        description: `${admin.name} permanently deleted sub-agent ${target.name} (${target.email})`,
      });
      await tx.user.delete({ where: { id: target.id } });
    });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2003") {
      return {
        error: "Can't delete — this sub-agent has existing bookings, customers, or inquiries. Suspend them instead.",
      };
    }
    throw err;
  }

  revalidatePath("/admin/sub-agents");
  revalidatePath("/admin/activity");
  return { success: true };
}

export async function approveSubAgentRegistration(userId: string): Promise<SubAgentFormState> {
  const admin = await requireAgencyAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.agencyId !== admin.agencyId || target.status !== UserStatus.PENDING) {
    return { error: "Registration request not found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: target.id }, data: { status: UserStatus.ACTIVE } });

    await tx.notification.create({
      data: {
        userId: target.id,
        type: "SUB_AGENT_STATUS_CHANGED",
        title: "Account approved",
        message: "Your sub-agent account has been approved. You can now sign in.",
      },
    });

    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "SUB_AGENT_STATUS_CHANGED",
      description: `${admin.name} approved ${target.name}'s registration request`,
    });
  });

  revalidatePath("/admin/sub-agents");
  revalidatePath("/admin/activity");
  return { success: true };
}

export async function rejectSubAgentRegistration(userId: string): Promise<SubAgentFormState> {
  const admin = await requireAgencyAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.agencyId !== admin.agencyId || target.status !== UserStatus.PENDING) {
    return { error: "Registration request not found" };
  }

  await prisma.$transaction(async (tx) => {
    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "SUB_AGENT_STATUS_CHANGED",
      description: `${admin.name} rejected ${target.name}'s registration request`,
    });

    // Never activated, so no bookings/customers to worry about — safe to remove.
    await tx.user.delete({ where: { id: target.id } });
  });

  revalidatePath("/admin/sub-agents");
  revalidatePath("/admin/activity");
  return { success: true };
}