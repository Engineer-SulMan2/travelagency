"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role, UserStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity-log";

const schema = z.object({
  agencyId: z.string().min(1, "Please select an agency"),
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterSubAgentState = { error?: string; success?: boolean };

export async function registerSubAgent(
  _prevState: RegisterSubAgentState,
  formData: FormData
): Promise<RegisterSubAgentState> {
  const parsed = schema.safeParse({
    agencyId: formData.get("agencyId"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { agencyId, name, email, password } = parsed.data;

  const [existing, agency] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.agency.findUnique({ where: { id: agencyId } }),
  ]);

  if (existing) return { error: "An account with this email already exists." };
  if (!agency) return { error: "Selected agency not found." };

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.SUB_AGENT,
        status: UserStatus.PENDING,
        agencyId: agency.id,
        defaultMarkupPct: agency.defaultMarkupPct,
      },
    });

    const admins = await tx.user.findMany({
      where: { agencyId: agency.id, role: { in: [Role.SUPER_ADMIN, Role.AGENCY_ADMIN] } },
      select: { id: true },
    });

    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          type: "SYSTEM",
          title: "New sub-agent awaiting approval",
          message: `${name} (${email}) has requested to join your agency as a sub-agent.`,
          link: "/admin/sub-agents",
        },
      });
    }

    await logActivity(tx, {
      actorId: user.id,
      agencyId: agency.id,
      action: "SUB_AGENT_CREATED",
      description: `${name} (${email}) requested to join as a sub-agent — awaiting approval`,
    });
  });

  return { success: true };
}