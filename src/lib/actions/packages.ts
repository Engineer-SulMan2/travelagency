"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Role[] type explicitly set kar di hai taake TypeScript type mismatch na de
const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN];

async function requireAgencyAdmin() {
  const session = await auth();
  
  // Checking fixed: TypeScript safely validates the role
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role as Role)) {
    throw new Error("Not authorized");
  }
  
  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin) throw new Error("Not authorized");
  return admin;
}

export type PackageFormState = { error?: string; success?: boolean };

const packageSchema = z.object({
  title: z.string().min(2, "Title is too short"),
  destination: z.string().min(2, "Destination is required"),
  durationDays: z.coerce.number().int().min(1).max(60),
  description: z.string().min(5, "Description is too short"),
  inclusions: z.string(), // comma-separated, split below
  basePrice: z.coerce.number().min(0),
  maxSeats: z.coerce.number().int().min(1).optional(),
  category: z.enum(["HOLIDAY", "TOUR", "UMRAH", "GROUP"]).default("HOLIDAY"),
  validUntil: z.string().optional(),
});

export async function createPackage(
  _prevState: PackageFormState,
  formData: FormData
): Promise<PackageFormState> {
  const admin = await requireAgencyAdmin();

  const parsed = packageSchema.safeParse({
    title: formData.get("title"),
    destination: formData.get("destination"),
    durationDays: formData.get("durationDays"),
    description: formData.get("description"),
    inclusions: formData.get("inclusions"),
    basePrice: formData.get("basePrice"),
    maxSeats: formData.get("maxSeats") || undefined,
    category: formData.get("category") || "HOLIDAY",
    validUntil: formData.get("validUntil") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { title, destination, durationDays, description, inclusions, basePrice, maxSeats, category, validUntil } =
    parsed.data;

  await prisma.package.create({
    data: {
      title,
      destination,
      durationDays,
      description,
      inclusions: inclusions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      basePrice,
      maxSeats: maxSeats ?? null,
      category,
      validUntil: validUntil ? new Date(validUntil) : null,
      agencyId: admin.agencyId,
    },
  });

  revalidatePath("/admin/packages/manage");
  revalidatePath("/admin/tours");
  revalidatePath("/admin/umrah");
  revalidatePath("/admin/group");
  revalidatePath("/admin/packages");
  return { success: true };
}

export async function togglePackageActive(packageId: string): Promise<PackageFormState> {
  const admin = await requireAgencyAdmin();

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || (admin.role !== Role.SUPER_ADMIN && pkg.agencyId !== admin.agencyId)) {
    return { error: "Package not found" };
  }

  await prisma.package.update({
    where: { id: pkg.id },
    data: { isActive: !pkg.isActive },
  });

  revalidatePath("/admin/packages/manage");
  return { success: true };
}

export async function updatePackageExpiry(packageId: string, validUntil: string | null): Promise<PackageFormState> {
  const admin = await requireAgencyAdmin();

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || (admin.role !== Role.SUPER_ADMIN && pkg.agencyId !== admin.agencyId)) {
    return { error: "Package not found" };
  }

  await prisma.package.update({
    where: { id: pkg.id },
    data: { validUntil: validUntil ? new Date(validUntil) : null },
  });

  revalidatePath("/admin/packages/manage");
  return { success: true };
}

// -------------------- Package images (up to 3) --------------------

const MAX_PACKAGE_IMAGES = 3;
const MAX_IMAGE_DATA_URL_LENGTH = 2_000_000;

function isValidImageDataUrl(value: string) {
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(value) && value.length <= MAX_IMAGE_DATA_URL_LENGTH;
}

export async function addPackageImage(packageId: string, dataUrl: string): Promise<PackageFormState> {
  const admin = await requireAgencyAdmin();

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || (admin.role !== Role.SUPER_ADMIN && pkg.agencyId !== admin.agencyId)) {
    return { error: "Package not found" };
  }
  if (!isValidImageDataUrl(dataUrl)) {
    return { error: "Please upload a valid image under ~1.5MB." };
  }
  if (pkg.images.length >= MAX_PACKAGE_IMAGES) {
    return { error: `You can add up to ${MAX_PACKAGE_IMAGES} images per package.` };
  }

  await prisma.package.update({
    where: { id: pkg.id },
    data: { images: [...pkg.images, dataUrl] },
  });

  revalidatePath("/admin/packages/manage");
  revalidatePath("/admin/packages");
  revalidatePath("/agent/packages");
  return { success: true };
}

export async function removePackageImage(packageId: string, index: number): Promise<PackageFormState> {
  const admin = await requireAgencyAdmin();

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || (admin.role !== Role.SUPER_ADMIN && pkg.agencyId !== admin.agencyId)) {
    return { error: "Package not found" };
  }

  const nextImages = pkg.images.filter((_, i) => i !== index);
  await prisma.package.update({ where: { id: pkg.id }, data: { images: nextImages } });

  revalidatePath("/admin/packages/manage");
  revalidatePath("/admin/packages");
  revalidatePath("/agent/packages");
  return { success: true };
}

// -------------------- Bulk import (from Excel) --------------------

export type BulkImportResult = { error?: string; success?: boolean; imported?: number; skipped?: number };

const bulkRowSchema = z.object({
  title: z.string().min(2),
  destination: z.string().min(2),
  durationDays: z.coerce.number().int().min(1).max(60),
  description: z.string().min(5),
  inclusions: z.string(),
  basePrice: z.coerce.number().min(0),
  category: z.enum(["HOLIDAY", "TOUR", "UMRAH", "GROUP"]).default("HOLIDAY"),
});

export async function bulkImportPackages(
  rows: {
    title: string;
    destination: string;
    durationDays: number;
    description: string;
    inclusions: string;
    basePrice: number;
    category?: string;
  }[]
): Promise<BulkImportResult> {
  const admin = await requireAgencyAdmin();

  if (!Array.isArray(rows) || rows.length === 0) return { error: "No rows to import" };
  if (rows.length > 200) return { error: "Import is limited to 200 packages at a time" };

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const parsed = bulkRowSchema.safeParse(row);
    if (!parsed.success) {
      skipped++;
      continue;
    }

    await prisma.package.create({
      data: {
        title: parsed.data.title,
        destination: parsed.data.destination,
        durationDays: parsed.data.durationDays,
        description: parsed.data.description,
        inclusions: parsed.data.inclusions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        basePrice: parsed.data.basePrice,
        category: parsed.data.category,
        agencyId: admin.agencyId,
      },
    });
    imported++;
  }

  revalidatePath("/admin/packages/manage");
  revalidatePath("/admin/tours");
  revalidatePath("/admin/umrah");
  revalidatePath("/admin/group");
  revalidatePath("/admin/packages");
  return { success: true, imported, skipped };
}