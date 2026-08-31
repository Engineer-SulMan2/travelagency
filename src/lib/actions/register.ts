"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role, UserStatus } from "@prisma/client";

const registerSchema = z.object({
  agencyName: z.string().min(2, "Agency name is too short"),
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterState = {
  error?: string;
  success?: boolean;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function registerAgency(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    agencyName: formData.get("agencyName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { agencyName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  let slug = slugify(agencyName);
  const slugTaken = await prisma.agency.findUnique({ where: { slug } });
  if (slugTaken) {
    slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const agency = await tx.agency.create({
      data: { name: agencyName, slug, email, approvedAt: new Date() },
    });

    // New agency admins start PENDING — they can't sign in until an
    // existing, active Agency Admin approves them. Super Admin is
    // deliberately NOT involved in this approval (platform oversight only).
    await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.AGENCY_ADMIN,
        status: UserStatus.PENDING,
        agencyId: agency.id,
      },
    });

    const existingAdmins = await tx.user.findMany({
      where: { role: Role.AGENCY_ADMIN, status: UserStatus.ACTIVE },
      select: { id: true },
    });

    for (const admin of existingAdmins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          type: "SYSTEM",
          title: "New agency admin awaiting approval",
          message: `${name} (${email}) wants to create "${agencyName}" and become its admin.`,
          link: "/admin/sub-agents",
        },
      });
    }
  });

  return { success: true };
}