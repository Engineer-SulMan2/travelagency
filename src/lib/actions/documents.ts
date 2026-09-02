"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { Role } from "@prisma/client";

export type DocumentActionState = { error?: string; success?: boolean };

const MAX_FILE_DATA_LENGTH = 4_000_000; // ~3MB file, generous ceiling for base64

async function requireAgencyAdmin() {
  const session = await auth();
  if (!session || !([Role.SUPER_ADMIN, Role.AGENCY_ADMIN] as Role[]).includes(session.user.role as Role)) {
    return null;
  }
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function uploadSubAgentDocument(
  userId: string,
  name: string,
  fileType: string,
  fileData: string
): Promise<DocumentActionState> {
  const admin = await requireAgencyAdmin();
  if (!admin) return { error: "Not authorized" };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.agencyId !== admin.agencyId) return { error: "Sub-agent not found" };

  if (fileData.length > MAX_FILE_DATA_LENGTH) {
    return { error: "File is too large — please keep it under ~3MB." };
  }
  if (!name.trim()) return { error: "Give the document a name" };

  await prisma.$transaction(async (tx) => {
    await tx.subAgentDocument.create({
      data: {
        userId: target.id,
        agencyId: admin.agencyId,
        uploadedById: admin.id,
        name: name.trim(),
        fileType,
        fileData,
      },
    });

    await logActivity(tx, {
      actorId: admin.id,
      agencyId: admin.agencyId,
      action: "SUB_AGENT_STATUS_CHANGED",
      description: `${admin.name} uploaded a document ("${name.trim()}") for ${target.name}`,
    });
  });

  revalidatePath(`/admin/sub-agents/${userId}`);
  return { success: true };
}

export async function deleteSubAgentDocument(documentId: string): Promise<DocumentActionState> {
  const admin = await requireAgencyAdmin();
  if (!admin) return { error: "Not authorized" };

  const doc = await prisma.subAgentDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.agencyId !== admin.agencyId) return { error: "Document not found" };

  await prisma.subAgentDocument.delete({ where: { id: documentId } });

  revalidatePath(`/admin/sub-agents/${doc.userId}`);
  return { success: true };
}

// -------------------- Self-service (any authenticated user, own docs only) --------------------

export async function uploadMyDocument(
  name: string,
  fileType: string,
  fileData: string
): Promise<DocumentActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  if (fileData.length > MAX_FILE_DATA_LENGTH) {
    return { error: "File is too large — please keep it under ~3MB." };
  }
  if (!name.trim()) return { error: "Give the document a name" };

  await prisma.subAgentDocument.create({
    data: {
      userId: user.id,
      agencyId: user.agencyId,
      uploadedById: user.id,
      name: name.trim(),
      fileType,
      fileData,
    },
  });

  revalidatePath("/agent/settings");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function deleteMyDocument(documentId: string): Promise<DocumentActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const doc = await prisma.subAgentDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.userId !== session.user.id) return { error: "Document not found" };

  await prisma.subAgentDocument.delete({ where: { id: documentId } });

  revalidatePath("/agent/settings");
  revalidatePath("/admin/settings");
  return { success: true };
}