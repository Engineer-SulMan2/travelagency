import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type LogClient = typeof prisma | Prisma.TransactionClient;

export async function logActivity(
  client: LogClient,
  params: {
    actorId: string;
    agencyId?: string | null;
    action: string;
    description: string;
  }
) {
  await client.activityLog.create({
    data: {
      actorId: params.actorId,
      agencyId: params.agencyId ?? null,
      action: params.action,
      description: params.description,
    },
  });
}