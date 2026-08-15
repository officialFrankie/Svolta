import { SECTIONS, type Entry, type Goal } from "./types";

export type GoalTask = {
  id: string;
  section: (typeof SECTIONS)[number];
  task: string;
};

/** Task giornalieri della roadmap, in ordine di sezione, con id stabile `${sezione}-${i}`. */
export function goalTaskList(goal: Goal | null): GoalTask[] {
  if (!goal?.roadmap?.sections) return [];
  const out: GoalTask[] = [];
  for (const s of SECTIONS) {
    const daily = goal.roadmap.sections[s.id]?.daily ?? [];
    daily.forEach((task, i) => out.push({ id: `${s.id}-${i}`, section: s, task }));
  }
  return out;
}

export function missionStats(goal: Goal | null, entry: Entry) {
  const tasks = goalTaskList(goal);
  const done = tasks.filter((t) => entry.goalTasks?.[t.id]).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return { tasks, done, pct };
}

export function daysToDeadline(goal: Goal | null): number | null {
  if (!goal?.deadline) return null;
  return Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 864e5));
}
