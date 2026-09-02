"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type CustomerFormState = { error?: string; success?: boolean };

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN];

function parseTags(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
}

const customerSchema = z.object({
  fullName: z.string().min(2, "Name is too short"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  passportNumber: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  const parsed = customerSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    passportNumber: formData.get("passportNumber") || undefined,
    notes: formData.get("notes") || undefined,
    tags: formData.get("tags") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.customer.create({
    data: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      passportNumber: parsed.data.passportNumber || null,
      notes: parsed.data.notes || null,
      tags: parseTags(parsed.data.tags),
      agencyId: user.agencyId,
      createdById: user.id,
    },
  });

  revalidatePath("/agent/customers");
  revalidatePath("/admin/customers");
  return { success: true };
}

// Admins can manage every customer in their agency; sub-agents can only
// manage the customers they personally created.
function canManage(user: { id: string; role: Role; agencyId: string | null }, customer: { agencyId: string | null; createdById: string }) {
  if (customer.agencyId !== user.agencyId) return false;
  if (ADMIN_ROLES.includes(user.role)) return true;
  return customer.createdById === user.id;
}

export async function updateCustomer(input: {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  passportNumber: string;
  notes: string;
  tags: string;
}): Promise<CustomerFormState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  const customer = await prisma.customer.findUnique({ where: { id: input.id } });
  if (!customer || !canManage(user, customer)) {
    return { error: "Customer not found" };
  }

  const parsed = customerSchema.safeParse({
    fullName: input.fullName,
    phone: input.phone || undefined,
    email: input.email || undefined,
    passportNumber: input.passportNumber || undefined,
    notes: input.notes || undefined,
    tags: input.tags || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.customer.update({
    where: { id: input.id },
    data: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      passportNumber: parsed.data.passportNumber || null,
      notes: parsed.data.notes || null,
      tags: parseTags(parsed.data.tags),
    },
  });

  revalidatePath("/agent/customers");
  revalidatePath("/admin/customers");
  return { success: true };
}

export async function deleteCustomer(id: string): Promise<CustomerFormState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer || !canManage(user, customer)) {
    return { error: "Customer not found" };
  }

  await prisma.customer.delete({ where: { id } });

  revalidatePath("/agent/customers");
  revalidatePath("/admin/customers");
  return { success: true };
}

// -------------------- Search (for booking-flow autofill) --------------------
// Admins see every customer in the agency; sub-agents only see their own —
// same visibility rule as the Customers page.

export async function getMyCustomers() {
  const session = await auth();
  if (!session) return [];

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return [];

  const isAdmin = ([Role.SUPER_ADMIN, Role.AGENCY_ADMIN] as Role[]).includes(user.role);

  const customers = await prisma.customer.findMany({
    where: isAdmin ? { agencyId: user.agencyId } : { createdById: user.id },
    orderBy: { fullName: "asc" },
  });

  return customers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    phone: c.phone,
    email: c.email,
    passportNumber: c.passportNumber,
    notes: c.notes,
    tags: c.tags,
    loyaltyPoints: c.loyaltyPoints,
    createdAt: c.createdAt.toISOString(),
  }));
}