"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, UserStatus } from "@prisma/client";

export type AdminApprovalState = { error?: string; success?: boolean };

// Deliberately Agency Admin only — Super Admin does not approve new
// agency admins, per the platform's ownership model.
async function requireActiveAgencyAdmin() {
  const session = await auth();
  if (!session || session.user.role !== Role.AGENCY_ADMIN) return null;
  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || admin.status !== UserStatus.ACTIVE) return null;
  return admin;
}

export async function approveNewAgencyAdmin(userId: string): Promise<AdminApprovalState> {
  const approver = await requireActiveAgencyAdmin();
  if (!approver) return { error: "Not authorized" };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== Role.AGENCY_ADMIN || target.status !== UserStatus.PENDING) {
    return { error: "Request not found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: target.id }, data: { status: UserStatus.ACTIVE } });

    await tx.notification.create({
      data: {
        userId: target.id,
        type: "SYSTEM",
        title: "Account approved",
        message: `${approver.name} approved your agency admin account. You can now sign in.`,
      },
    });
  });

  revalidatePath("/admin/sub-agents");
  return { success: true };
}

export async function rejectNewAgencyAdmin(userId: string): Promise<AdminApprovalState> {
  const approver = await requireActiveAgencyAdmin();
  if (!approver) return { error: "Not authorized" };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== Role.AGENCY_ADMIN || target.status !== UserStatus.PENDING) {
    return { error: "Request not found" };
  }

  // A pending new-agency signup has no bookings/sub-agents yet — safe to
  // remove the account and the agency it was creating.
  await prisma.$transaction(async (tx) => {
    await tx.user.delete({ where: { id: target.id } });
    if (target.agencyId) {
      await tx.agency.delete({ where: { id: target.agencyId } });
    }
  });

  revalidatePath("/admin/sub-agents");
  return { success: true };
}