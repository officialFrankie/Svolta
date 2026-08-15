import { PrismaClient } from "@prisma/client";

/**
 * PostgreSQL (Neon su Vercel, o qualsiasi Postgres via DATABASE_URL).
 * Singleton per evitare troppe connessioni in dev con l'hot reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
