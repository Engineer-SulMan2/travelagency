"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ChangePasswordState = { error?: string; success?: boolean };

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"],
  });

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.password) return { error: "Not authenticated" };

  const currentValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!currentValid) {
    return { error: "Current password is incorrect" };
  }

  const sameAsOld = await bcrypt.compare(parsed.data.newPassword, user.password);
  if (sameAsOld) {
    return { error: "New password must be different from your current password" };
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return { success: true };
}