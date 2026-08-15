import { PrismaClient } from "@prisma/client";

/**
 * Default: SQLite locale (DATABASE_URL=file:./dev.db) — nessun servizio esterno.
 * Se TURSO_DATABASE_URL è valorizzato (deploy su Vercel, dove il filesystem è
 * effimero), usa l'adapter libSQL: stesso schema, stesso codice.
 */
function buildClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    // Import dinamici via require per non pagare il costo quando non serve
    const { createClient } = require("@libsql/client") as typeof import("@libsql/client");
    const { PrismaLibSQL } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const libsql = createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
