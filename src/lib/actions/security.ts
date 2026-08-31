"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function getMyLoginEvents() {
  const session = await auth();
  if (!session) return [];

  const events = await prisma.loginEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return events.map((e) => ({
    id: e.id,
    success: e.success,
    userAgent: e.userAgent,
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function getMyTrustedDevices() {
  const session = await auth();
  if (!session) return [];

  const devices = await prisma.trustedDevice.findMany({
    where: { userId: session.user.id },
    orderBy: { lastUsedAt: "desc" },
  });

  return devices.map((d) => ({
    id: d.id,
    userAgent: d.userAgent,
    createdAt: d.createdAt.toISOString(),
    lastUsedAt: d.lastUsedAt.toISOString(),
    expiresAt: d.expiresAt.toISOString(),
  }));
}

export type SecurityActionState = { error?: string; success?: boolean };

export async function revokeTrustedDevice(id: string): Promise<SecurityActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  await prisma.trustedDevice.deleteMany({ where: { id, userId: session.user.id } });

  return { success: true };
}

// Self-service version of forceSignOutUser below — a user clearing every
// one of their OWN trusted devices, e.g. after losing a phone.
export async function signOutAllMyDevices(): Promise<SecurityActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  await prisma.trustedDevice.deleteMany({ where: { userId: session.user.id } });

  return { success: true };
}

// -------------------- Agency-wide (Agency Admin only) --------------------

async function requireAgencyAdmin() {
  const session = await auth();
  if (!session || ![Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(session.user.role as Role)) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function getAgencyLoginEvents() {
  const admin = await requireAgencyAdmin();
  if (!admin?.agencyId) return [];

  const events = await prisma.loginEvent.findMany({
    where: { user: { agencyId: admin.agencyId } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { name: true } } },
  });

  return events.map((e) => ({
    id: e.id,
    userName: e.user?.name ?? e.email,
    success: e.success,
    userAgent: e.userAgent,
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function getAgencyTrustedDevices() {
  const admin = await requireAgencyAdmin();
  if (!admin?.agencyId) return [];

  const devices = await prisma.trustedDevice.findMany({
    where: { user: { agencyId: admin.agencyId } },
    orderBy: { lastUsedAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return devices.map((d) => ({
    id: d.id,
    userId: d.userId,
    userName: d.user.name,
    userAgent: d.userAgent,
    lastUsedAt: d.lastUsedAt.toISOString(),
  }));
}

// Remotely signs a team member out everywhere by revoking every trusted
// device of theirs — their next request will require OTP again. Doesn't
// (and can't) kill an already-active browser session, but forces
// re-verification the next time they need to skip OTP.
export async function forceSignOutUser(userId: string): Promise<SecurityActionState> {
  const admin = await requireAgencyAdmin();
  if (!admin?.agencyId) return { error: "Not authorized" };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.agencyId !== admin.agencyId) return { error: "User not found" };

  await prisma.trustedDevice.deleteMany({ where: { userId } });

  await prisma.notification.create({
    data: {
      userId,
      type: "SYSTEM",
      title: "Signed out remotely",
      message: `${admin.name} signed you out of all trusted devices. You'll need to verify with OTP on your next login.`,
    },
  });

  revalidatePath("/admin/sub-agents");
  revalidatePath("/admin/security");
  return { success: true };
}