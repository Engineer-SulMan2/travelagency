"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, type ProductType } from "@prisma/client";

export type BookingNoteActionState = { error?: string; success?: boolean };

export type BookingNoteRow = {
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

export async function getBookingNotes(productType: ProductType, referenceId: string): Promise<BookingNoteRow[]> {
  const user = await requireAgencyMember();
  if (!user) return [];

  const notes = await prisma.bookingNote.findMany({
    where: { productType, referenceId, agencyId: user.agencyId },
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

export async function addBookingNote(
  productType: ProductType,
  referenceId: string,
  note: string
): Promise<BookingNoteActionState> {
  const user = await requireAgencyMember();
  if (!user) return { error: "Not authenticated" };
  if (!note.trim()) return { error: "Note can't be empty" };
  if (note.length > 1000) return { error: "Note is too long" };

  await prisma.bookingNote.create({
    data: {
      productType,
      referenceId,
      agencyId: user.agencyId,
      authorId: user.id,
      note: note.trim(),
    },
  });

  revalidatePath("/admin/bookings");
  revalidatePath("/agent/bookings");
  return { success: true };
}

export async function deleteBookingNote(noteId: string): Promise<BookingNoteActionState> {
  const user = await requireAgencyMember();
  if (!user) return { error: "Not authenticated" };

  const note = await prisma.bookingNote.findUnique({ where: { id: noteId } });
  if (!note || note.agencyId !== user.agencyId) return { error: "Note not found" };

  const isAdmin = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(user.role);
  if (!isAdmin && note.authorId !== user.id) return { error: "You can only remove your own notes" };

  await prisma.bookingNote.delete({ where: { id: noteId } });

  revalidatePath("/admin/bookings");
  revalidatePath("/agent/bookings");
  return { success: true };
}