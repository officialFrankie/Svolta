import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient LAZY: l'istanza viene creata alla prima query, non all'import.
 * Fondamentale su Vercel: `next build` importa le route API ("Collecting page
 * data") e un `new PrismaClient()` a livello di modulo farebbe fallire la
 * build se DATABASE_URL non è disponibile in quell'ambiente. A runtime la
 * variabile c'è sempre (integrazione Neon).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = new PrismaClient();
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});
