"use server";

import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, getOtpauthUri, verifyTotpCode } from "@/lib/totp";

export type TotpActionState = { error?: string; success?: boolean };
export type TotpSetupData = { secret: string; qrCodeDataUrl: string };

export async function startTotpSetup(): Promise<TotpSetupData | { error: string }> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  const secret = generateTotpSecret();
  // Stored immediately so confirmTotpSetup can verify against it, but
  // totpEnabled stays false — and therefore has no effect on login — until
  // the user proves they scanned it correctly.
  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret, totpEnabled: false } });

  const uri = getOtpauthUri(user.email, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(uri, { width: 220, margin: 1 });

  return { secret, qrCodeDataUrl };
}

export async function confirmTotpSetup(code: string): Promise<TotpActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.totpSecret) return { error: "Start setup first" };

  const valid = verifyTotpCode(user.email, user.totpSecret, code);
  if (!valid) return { error: "Incorrect code. Please try again." };

  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });

  revalidatePath("/admin/security");
  revalidatePath("/agent/security");
  return { success: true };
}

export async function disableTotp(code: string): Promise<TotpActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.totpEnabled || !user.totpSecret) return { error: "Authenticator app isn't enabled" };

  const valid = verifyTotpCode(user.email, user.totpSecret, code);
  if (!valid) return { error: "Incorrect code" };

  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: null, totpEnabled: false } });

  revalidatePath("/admin/security");
  revalidatePath("/agent/security");
  return { success: true };
}

export async function getTotpStatus(): Promise<{ enabled: boolean }> {
  const session = await auth();
  if (!session) return { enabled: false };

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { totpEnabled: true } });
  return { enabled: user?.totpEnabled ?? false };
}