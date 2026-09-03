import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prevents creating a new PrismaClient on every hot-reload in dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 requires an explicit driver adapter — it no longer auto-connects
// from the DATABASE_URL env var the way earlier versions did.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;