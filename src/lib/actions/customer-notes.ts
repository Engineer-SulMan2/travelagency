"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type CustomerNoteActionState = { error?: string; success?: boolean };

export type CustomerNoteRow = {
  id: string;
  note: string;
  authorName: string;
  createdAt: string;
};

async function requireAgencyMember() {
  const session = await auth();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function getCustomerNotes(customerId: string): Promise<CustomerNoteRow[]> {
  const user = await requireAgencyMember();
  if (!user) return [];

  const notes = await prisma.customerNote.findMany({
    where: { customerId, agencyId: user.agencyId },
    orderBy: { createdAt: "desc" },
  });

  const authorIds = [...new Set(notes.map((n) => n.authorId))];
  const authors = await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } });
  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  return notes.map((n) => ({
    id: n.id,
    note: n.note,
    authorName: authorMap.get(n.authorId) ?? "Unknown",
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function addCustomerNote(customerId: string, note: string): Promise<CustomerNoteActionState> {
  const user = await requireAgencyMember();
  if (!user) return { error: "Not authenticated" };
  if (!note.trim()) return { error: "Note can't be empty" };
  if (note.length > 1000) return { error: "Note is too long" };

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer || customer.agencyId !== user.agencyId) return { error: "Customer not found" };

  await prisma.customerNote.create({
    data: {
      customerId,
      agencyId: user.agencyId,
      authorId: user.id,
      note: note.trim(),
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath("/agent/customers");
  return { success: true };
}

export async function deleteCustomerNote(noteId: string): Promise<CustomerNoteActionState> {
  const user = await requireAgencyMember();
  if (!user) return { error: "Not authenticated" };

  const note = await prisma.customerNote.findUnique({ where: { id: noteId } });
  if (!note || note.agencyId !== user.agencyId) return { error: "Note not found" };

  const isAdmin = ([Role.SUPER_ADMIN, Role.AGENCY_ADMIN] as Role[]).includes(user.role);
  if (!isAdmin && note.authorId !== user.id) return { error: "You can only remove your own notes" };

  await prisma.customerNote.delete({ where: { id: noteId } });

  revalidatePath("/admin/customers");
  revalidatePath("/agent/customers");
  return { success: true };
}