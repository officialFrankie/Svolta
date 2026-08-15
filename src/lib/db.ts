import { prisma } from "./prisma";
import { safeParse } from "./json";
import {
  DEFAULT_SETTINGS,
  type Entry,
  type Goal,
  type Roadmap,
  type Settings,
} from "./types";
import type { Entry as DbEntry, Goal as DbGoal } from "@prisma/client";

/* ---------- mapper Entry ---------- */

export function toEntry(r: DbEntry): Entry {
  return {
    date: r.date,
    noSmoke: r.noSmoke,
    cravings: r.cravings,
    alcohol: r.alcohol,
    training: { done: r.trainingDone, type: r.trainingType, minutes: r.trainingMinutes },
    foodQuality: r.foodQuality,
    meals: r.meals,
    habits: safeParse(r.habits, {}),
    goalTasks: safeParse(r.goalTasks, {}),
    whoop: {
      recovery: r.whoopRecovery,
      sleepH: r.whoopSleepH,
      fcr: r.whoopFcr,
      vfc: r.whoopVfc,
      spo2: r.whoopSpo2,
    },
    mood: r.mood,
    anxiety: r.anxiety,
    notes: r.notes,
  };
}

function toRow(e: Entry) {
  return {
    noSmoke: !!e.noSmoke,
    cravings: Number(e.cravings) || 0,
    alcohol: Number(e.alcohol) || 0,
    trainingDone: !!e.training?.done,
    trainingType: e.training?.type ?? "",
    trainingMinutes: e.training?.minutes ?? "",
    foodQuality: Number(e.foodQuality) || 0,
    meals: e.meals ?? "",
    habits: JSON.stringify(e.habits ?? {}),
    goalTasks: JSON.stringify(e.goalTasks ?? {}),
    whoopRecovery: e.whoop?.recovery ?? "",
    whoopSleepH: e.whoop?.sleepH ?? "",
    whoopFcr: e.whoop?.fcr ?? "",
    whoopVfc: e.whoop?.vfc ?? "",
    whoopSpo2: e.whoop?.spo2 ?? "",
    mood: Number(e.mood) || 3,
    anxiety: Number(e.anxiety) || 3,
    notes: e.notes ?? "",
  };
}

export async function getAllEntries(): Promise<Record<string, Entry>> {
  const rows = await prisma.entry.findMany({ orderBy: { date: "asc" } });
  const out: Record<string, Entry> = {};
  for (const r of rows) out[r.date] = toEntry(r);
  return out;
}

export async function upsertEntry(e: Entry): Promise<Entry> {
  const row = toRow(e);
  const saved = await prisma.entry.upsert({
    where: { date: e.date },
    create: { date: e.date, ...row },
    update: row,
  });
  return toEntry(saved);
}

/* ---------- Goal ---------- */

export function toGoal(g: DbGoal): Goal {
  return {
    id: g.id,
    title: g.title,
    deadline: g.deadline,
    roadmap: safeParse<Roadmap>(g.roadmap, { summary: "", sections: {}, milestones: [] }),
    createdAt: g.createdAt.toISOString(),
  };
}

export async function getActiveGoal(): Promise<Goal | null> {
  const g = await prisma.goal.findFirst({ where: { active: true }, orderBy: { id: "desc" } });
  return g ? toGoal(g) : null;
}

export async function setActiveGoal(title: string, deadline: string, roadmap: Roadmap): Promise<Goal> {
  await prisma.goal.updateMany({ where: { active: true }, data: { active: false, closedAt: new Date() } });
  const g = await prisma.goal.create({
    data: { title, deadline, roadmap: JSON.stringify(roadmap), active: true },
  });
  return toGoal(g);
}

export async function closeActiveGoal(): Promise<void> {
  await prisma.goal.updateMany({ where: { active: true }, data: { active: false, closedAt: new Date() } });
}

/* ---------- Settings (singleton id=1) ---------- */

export async function getSettings(): Promise<Settings> {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) {
    const created = await prisma.settings.create({ data: { id: 1 } });
    return stripId(created);
  }
  return stripId(s);
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const clean: Partial<Settings> = {};
  for (const k of ["quitAt", "netSalary", "balance", "investPlan", "tmaxRate", "tfr", "etfs"] as const) {
    if (typeof patch[k] === "string") clean[k] = patch[k];
  }
  const s = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, ...DEFAULT_SETTINGS, ...clean },
    update: clean,
  });
  return stripId(s);
}

function stripId(s: { id: number } & Settings): Settings {
  const { id: _id, ...rest } = s;
  return rest;
}
