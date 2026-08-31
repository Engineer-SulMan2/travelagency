"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type QuoteActionState = { error?: string; success?: boolean };

export type QuoteRow = {
  id: string;
  customerName: string;
  customerContact: string | null;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  shareToken: string;
  createdAt: string;
};

const quoteSchema = z.object({
  customerName: z.string().min(2, "Customer name is too short"),
  customerContact: z.string().optional(),
  title: z.string().min(2, "Title is too short"),
  description: z.string().optional(),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
});

export async function createQuote(
  _prevState: QuoteActionState,
  formData: FormData
): Promise<QuoteActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not authenticated" };

  const parsed = quoteSchema.safeParse({
    customerName: formData.get("customerName"),
    customerContact: formData.get("customerContact") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.quote.create({
    data: {
      userId: user.id,
      agencyId: user.agencyId,
      customerName: parsed.data.customerName,
      customerContact: parsed.data.customerContact || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      amount: parsed.data.amount,
      status: "SENT",
    },
  });

  revalidatePath("/agent/quotes");
  return { success: true };
}

export async function getMyQuotes(): Promise<QuoteRow[]> {
  const session = await auth();
  if (!session) return [];

  const quotes = await prisma.quote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return quotes.map((q) => ({
    id: q.id,
    customerName: q.customerName,
    customerContact: q.customerContact,
    title: q.title,
    description: q.description,
    amount: Number(q.amount),
    status: q.status,
    shareToken: q.shareToken,
    createdAt: q.createdAt.toISOString(),
  }));
}

export async function updateQuoteStatus(id: string, status: "ACCEPTED" | "EXPIRED"): Promise<QuoteActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote || quote.userId !== session.user.id) return { error: "Quote not found" };

  await prisma.quote.update({ where: { id }, data: { status } });
  revalidatePath("/agent/quotes");
  return { success: true };
}

export async function deleteQuote(id: string): Promise<QuoteActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote || quote.userId !== session.user.id) return { error: "Quote not found" };

  await prisma.quote.delete({ where: { id } });
  revalidatePath("/agent/quotes");
  return { success: true };
}