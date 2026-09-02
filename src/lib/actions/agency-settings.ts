"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { Role } from "@prisma/client";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export type AgencySettingsState = { error?: string; success?: boolean };

const CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]];

const settingsSchema = z.object({
  businessHours: z.string().max(200).optional(),
  termsAndConditions: z.string().max(5000).optional(),
  approvalThreshold: z.coerce.number().min(0).default(0),
  currency: z.enum(CURRENCY_CODES).default("PKR"),
  taxId: z.string().max(100).optional(),
  flightCancellationPolicy: z.string().max(2000).optional(),
  hotelCancellationPolicy: z.string().max(2000).optional(),
  packageCancellationPolicy: z.string().max(2000).optional(),
  visaCancellationPolicy: z.string().max(2000).optional(),
});

export async function updateAgencySettings(
  _prevState: AgencySettingsState,
  formData: FormData
): Promise<AgencySettingsState> {
  const session = await auth();
  if (!session || !([Role.SUPER_ADMIN, Role.AGENCY_ADMIN] as Role[]).includes(session.user.role as Role)) {
    return { error: "Not authorized" };
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin?.agencyId) return { error: "No agency associated with this account" };

  const parsed = settingsSchema.safeParse({
    businessHours: formData.get("businessHours") || undefined,
    termsAndConditions: formData.get("termsAndConditions") || undefined,
    approvalThreshold: formData.get("approvalThreshold") || 0,
    currency: formData.get("currency") || "PKR",
    taxId: formData.get("taxId") || undefined,
    flightCancellationPolicy: formData.get("flightCancellationPolicy") || undefined,
    hotelCancellationPolicy: formData.get("hotelCancellationPolicy") || undefined,
    packageCancellationPolicy: formData.get("packageCancellationPolicy") || undefined,
    visaCancellationPolicy: formData.get("visaCancellationPolicy") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: admin.agencyId! },
      data: {
        businessHours: parsed.data.businessHours ?? null,
        termsAndConditions: parsed.data.termsAndConditions ?? null,
        approvalThreshold: parsed.data.approvalThreshold,
        currency: parsed.data.currency,
        taxId: parsed.data.taxId ?? null,
        flightCancellationPolicy: parsed.data.flightCancellationPolicy ?? null,
        hotelCancellationPolicy: parsed.data.hotelCancellationPolicy ?? null,
        packageCancellationPolicy: parsed.data.packageCancellationPolicy ?? null,
        visaCancellationPolicy: parsed.data.visaCancellationPolicy ?? null,
      },
    });

    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "AGENCY_MARKUP_UPDATED",
      description: `${admin.name} updated agency business info`,
    });
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/agent");
  return { success: true };
}