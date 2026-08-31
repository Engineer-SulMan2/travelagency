"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type InquiryFormState = { error?: string; success?: boolean };

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN];

const inquirySchema = z.object({
  customerName: z.string().min(2, "Name is too short"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  productType: z.enum(["FLIGHT", "HOTEL", "PACKAGE", "VISA"]).optional().or(z.literal("")),
  details: z.string().min(3, "Add a few details about what they're interested in"),
});

export async function createInquiry(
  _prevState: InquiryFormState,
  formData: FormData
): Promise<InquiryFormState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  const parsed = inquirySchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    productType: formData.get("productType") || undefined,
    details: formData.get("details"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.inquiry.create({
    data: {
      customerName: parsed.data.customerName,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      productType: parsed.data.productType || null,
      details: parsed.data.details,
      agencyId: user.agencyId,
      createdById: user.id,
    },
  });

  revalidatePath("/agent/inquiries");
  revalidatePath("/admin/inquiries");
  return { success: true };
}

function canManage(user: { id: string; role: Role; agencyId: string | null }, inquiry: { agencyId: string | null; createdById: string }) {
  if (inquiry.agencyId !== user.agencyId) return false;
  if (ADMIN_ROLES.includes(user.role)) return true;
  return inquiry.createdById === user.id;
}

export async function updateInquiryStatus(
  id: string,
  status: "OPEN" | "CONTACTED" | "CONVERTED" | "CLOSED"
): Promise<InquiryFormState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry || !canManage(user, inquiry)) {
    return { error: "Inquiry not found" };
  }

  await prisma.inquiry.update({ where: { id }, data: { status } });

  revalidatePath("/agent/inquiries");
  revalidatePath("/admin/inquiries");
  return { success: true };
}

export async function deleteInquiry(id: string): Promise<InquiryFormState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry || !canManage(user, inquiry)) {
    return { error: "Inquiry not found" };
  }

  await prisma.inquiry.delete({ where: { id } });

  revalidatePath("/agent/inquiries");
  revalidatePath("/admin/inquiries");
  return { success: true };
}