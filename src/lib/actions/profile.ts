"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type ProfileActionState = { error?: string; success?: boolean };

// ~1.5MB image, generous ceiling for a base64 data URL
const MAX_DATA_URL_LENGTH = 2_000_000;

function isValidImageDataUrl(value: string) {
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(value) && value.length <= MAX_DATA_URL_LENGTH;
}

// -------------------- Name --------------------
// Email is deliberately not editable here — it's the login identifier and
// changing it touches auth, notifications, and OTP delivery, so it's kept
// out of scope for this simple self-service edit.

export async function updateProfileName(name: string): Promise<ProfileActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Name is too short" };
  if (trimmed.length > 80) return { error: "Name is too long" };

  await prisma.user.update({ where: { id: session.user.id }, data: { name: trimmed } });

  revalidatePath("/admin/settings");
  revalidatePath("/agent/settings");
  return { success: true };
}

export async function updateProfilePicture(dataUrl: string): Promise<ProfileActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  if (!isValidImageDataUrl(dataUrl)) {
    return { error: "Please upload a valid image under ~1.5MB." };
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { image: dataUrl } });

  revalidatePath("/admin", "layout");
  revalidatePath("/agent", "layout");
  return { success: true };
}

export async function removeProfilePicture(): Promise<ProfileActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  await prisma.user.update({ where: { id: session.user.id }, data: { image: null } });

  revalidatePath("/admin", "layout");
  revalidatePath("/agent", "layout");
  return { success: true };
}

export async function updateAgencyLogo(dataUrl: string): Promise<ProfileActionState> {
  const session = await auth();
  if (!session || ![Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(session.user.role as Role)) {
    return { error: "Not authorized" };
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin?.agencyId) return { error: "No agency associated with this account" };

  if (!isValidImageDataUrl(dataUrl)) {
    return { error: "Please upload a valid image under ~1.5MB." };
  }

  await prisma.agency.update({ where: { id: admin.agencyId }, data: { logoUrl: dataUrl } });

  revalidatePath("/admin", "layout");
  return { success: true };
}

export async function removeAgencyLogo(): Promise<ProfileActionState> {
  const session = await auth();
  if (!session || ![Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(session.user.role as Role)) {
    return { error: "Not authorized" };
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin?.agencyId) return { error: "No agency associated with this account" };

  await prisma.agency.update({ where: { id: admin.agencyId }, data: { logoUrl: null } });

  revalidatePath("/admin", "layout");
  return { success: true };
}

export async function updateAgencyStamp(dataUrl: string): Promise<ProfileActionState> {
  const session = await auth();
  if (!session || ![Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(session.user.role as Role)) {
    return { error: "Not authorized" };
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin?.agencyId) return { error: "No agency associated with this account" };

  if (!isValidImageDataUrl(dataUrl)) {
    return { error: "Please upload a valid image under ~1.5MB." };
  }

  await prisma.agency.update({ where: { id: admin.agencyId }, data: { stampUrl: dataUrl } });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function removeAgencyStamp(): Promise<ProfileActionState> {
  const session = await auth();
  if (!session || ![Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(session.user.role as Role)) {
    return { error: "Not authorized" };
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin?.agencyId) return { error: "No agency associated with this account" };

  await prisma.agency.update({ where: { id: admin.agencyId }, data: { stampUrl: null } });

  revalidatePath("/admin/settings");
  return { success: true };
}