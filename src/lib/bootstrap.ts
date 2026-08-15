import { prisma } from "./prisma";

/**
 * Bootstrap idempotente dello schema a runtime.
 *
 * La build su Vercel non tocca il database (niente `prisma migrate deploy`
 * in build: il container di build può non avere le env o l'endpoint pooled
 * rompe gli advisory lock di Prisma Migrate). Alla prima richiesta reale
 * verifichiamo che le tabelle esistano e, se mancano, le creiamo con lo
 * stesso DDL della migration iniziale (CREATE TABLE IF NOT EXISTS).
 *
 * Per future modifiche di schema: aggiungere una migration Prisma e
 * applicarla con `npm run db:deploy` (vedi README), oppure estendere qui.
 */

// Specchio esatto di prisma/migrations/20260815130000_init/migration.sql,
// reso idempotente con IF NOT EXISTS.
const DDL = [
  `CREATE TABLE IF NOT EXISTS "Entry" (
    "date" TEXT NOT NULL,
    "noSmoke" BOOLEAN NOT NULL DEFAULT true,
    "cravings" INTEGER NOT NULL DEFAULT 0,
    "alcohol" INTEGER NOT NULL DEFAULT 0,
    "trainingDone" BOOLEAN NOT NULL DEFAULT false,
    "trainingType" TEXT NOT NULL DEFAULT '',
    "trainingMinutes" TEXT NOT NULL DEFAULT '',
    "foodQuality" INTEGER NOT NULL DEFAULT 0,
    "meals" TEXT NOT NULL DEFAULT '',
    "habits" TEXT NOT NULL DEFAULT '{}',
    "goalTasks" TEXT NOT NULL DEFAULT '{}',
    "whoopRecovery" TEXT NOT NULL DEFAULT '',
    "whoopSleepH" TEXT NOT NULL DEFAULT '',
    "whoopFcr" TEXT NOT NULL DEFAULT '',
    "whoopVfc" TEXT NOT NULL DEFAULT '',
    "whoopSpo2" TEXT NOT NULL DEFAULT '',
    "mood" INTEGER NOT NULL DEFAULT 3,
    "anxiety" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Entry_pkey" PRIMARY KEY ("date")
  )`,
  `CREATE TABLE IF NOT EXISTS "Goal" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "roadmap" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "quitAt" TEXT NOT NULL DEFAULT '2026-08-10T20:00',
    "netSalary" TEXT NOT NULL DEFAULT '2028',
    "balance" TEXT NOT NULL DEFAULT '1800',
    "investPlan" TEXT NOT NULL DEFAULT '250',
    "tmaxRate" TEXT NOT NULL DEFAULT '250',
    "tfr" TEXT NOT NULL DEFAULT '6700',
    "etfs" TEXT NOT NULL DEFAULT 'S&P 500 · MSCI World · MSCI EM',
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
  )`,
];

let ready: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  try {
    // sonda economica: se la tabella esiste, non c'è nulla da fare
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "Settings" LIMIT 1`);
    return;
  } catch {
    /* tabella mancante (42P01) o schema mai creato: applica il DDL */
  }
  for (const stmt of DDL) {
    await prisma.$executeRawUnsafe(stmt);
  }
}

/** Da chiamare prima di ogni accesso al DB. Memoizzata per processo; se fallisce riprova alla prossima chiamata. */
export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = bootstrap().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}
