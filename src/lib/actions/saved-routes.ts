"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SavedRouteActionState = { error?: string; success?: boolean };

export type SavedRouteRow = {
  id: string;
  label: string | null;
  origin: string;
  destination: string;
};

const routeSchema = z.object({
  origin: z.string().length(3, "Use a 3-letter airport code"),
  destination: z.string().length(3, "Use a 3-letter airport code"),
  label: z.string().optional(),
});

export async function addSavedRoute(
  _prevState: SavedRouteActionState,
  formData: FormData
): Promise<SavedRouteActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const parsed = routeSchema.safeParse({
    origin: (formData.get("origin") as string)?.toUpperCase(),
    destination: (formData.get("destination") as string)?.toUpperCase(),
    label: formData.get("label") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (parsed.data.origin === parsed.data.destination) return { error: "Origin and destination can't be the same" };

  const existingCount = await prisma.savedRoute.count({ where: { userId: session.user.id } });
  if (existingCount >= 10) return { error: "You can save up to 10 routes — remove one first" };

  await prisma.savedRoute.create({
    data: {
      userId: session.user.id,
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      label: parsed.data.label || null,
    },
  });

  revalidatePath("/agent/flights");
  return { success: true };
}

export async function deleteSavedRoute(id: string): Promise<SavedRouteActionState> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  await prisma.savedRoute.deleteMany({ where: { id, userId: session.user.id } });

  revalidatePath("/agent/flights");
  return { success: true };
}

export async function getMySavedRoutes(): Promise<SavedRouteRow[]> {
  const session = await auth();
  if (!session) return [];

  const routes = await prisma.savedRoute.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return routes.map((r) => ({ id: r.id, label: r.label, origin: r.origin, destination: r.destination }));
}