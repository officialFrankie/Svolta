-- CreateTable
CREATE TABLE "Entry" (
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
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "roadmap" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "quitAt" TEXT NOT NULL DEFAULT '2026-08-10T20:00',
    "netSalary" TEXT NOT NULL DEFAULT '2028',
    "balance" TEXT NOT NULL DEFAULT '1800',
    "investPlan" TEXT NOT NULL DEFAULT '250',
    "tmaxRate" TEXT NOT NULL DEFAULT '250',
    "tfr" TEXT NOT NULL DEFAULT '6700',
    "etfs" TEXT NOT NULL DEFAULT 'S&P 500 · MSCI World · MSCI EM',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

