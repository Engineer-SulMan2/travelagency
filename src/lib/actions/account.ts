"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type AccountActionState = { error?: string; success?: boolean };

export async function deleteMyAccount(): Promise<AccountActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  if (user.role !== Role.SUB_AGENT) {
    return { error: "Only sub-agent accounts can self-delete here. Contact your agency admin." };
  }

  try {
    await prisma.user.delete({ where: { id: user.id } });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2003") {
      return {
        error:
          "Can't delete your account — you have existing bookings, customers, or inquiries. Contact your agency admin.",
      };
    }
    throw err;
  }

  return { success: true };
}