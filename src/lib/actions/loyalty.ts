"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type LoyaltyActionState = { error?: string; success?: boolean };

function canManage(user: { id: string; role: Role; agencyId: string | null }, customer: { agencyId: string | null; createdById: string }) {
  if (customer.agencyId !== user.agencyId) return false;
  if ([Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(user.role)) return true;
  return customer.createdById === user.id;
}

export async function adjustLoyaltyPoints(customerId: string, delta: number): Promise<LoyaltyActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer || !canManage(user, customer)) {
    return { error: "Customer not found" };
  }

  const nextPoints = Math.max(0, customer.loyaltyPoints + delta);

  await prisma.customer.update({
    where: { id: customerId },
    data: { loyaltyPoints: nextPoints },
  });

  revalidatePath("/agent/customers");
  revalidatePath("/admin/customers");
  return { success: true };
}