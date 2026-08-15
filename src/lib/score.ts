import type { Entry } from "./types";

export type ScorePart = { name: string; val: number; max: number };

/**
 * Svolta Score (0-100):
 * fumo 30 · alcol 20 (0 drink=20, 1-2=10, 3+=0) · movimento 20 (allenamento=20,
 * solo camminata=12) · nutrizione 15 (qualità x3) · sonno 10 (>=7.5h=10, >=7=8,
 * >=6=4) · mente 5 (2 punti per abitudine mentale, max 5).
 */
export function dayScore(e: Entry): { score: number; parts: ScorePart[] } {
  let s = 0;
  const parts: ScorePart[] = [];

  const smoke = e.noSmoke ? 30 : 0;
  s += smoke;
  parts.push({ name: "Niente fumo", val: smoke, max: 30 });

  const al = Number(e.alcohol) || 0;
  const alPts = al === 0 ? 20 : al <= 2 ? 10 : 0;
  s += alPts;
  parts.push({ name: "Alcol", val: alPts, max: 20 });

  const mv = e.training.done ? 20 : e.habits.walk ? 12 : 0;
  s += mv;
  parts.push({ name: "Movimento", val: mv, max: 20 });

  const nu = (Number(e.foodQuality) || 0) * 3;
  s += nu;
  parts.push({ name: "Nutrizione", val: nu, max: 15 });

  const sl = Number(e.whoop.sleepH) || 0;
  const slPts = sl >= 7.5 ? 10 : sl >= 7 ? 8 : sl >= 6 ? 4 : 0;
  s += slPts;
  parts.push({ name: "Sonno", val: slPts, max: 10 });

  const mind = (["coldShower", "breath", "reading"] as const).filter((h) => e.habits[h]).length;
  const mPts = Math.min(5, mind * 2);
  s += mPts;
  parts.push({ name: "Mente", val: mPts, max: 5 });

  return { score: Math.min(100, s), parts };
}

/** Media dello score sugli ultimi `days` giorni di calendario che hanno un log. */
export function periodAvg(entries: Record<string, Entry>, days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const z = (n: number) => String(n).padStart(2, "0");
  const cutoffKey = `${cutoff.getFullYear()}-${z(cutoff.getMonth() + 1)}-${z(cutoff.getDate())}`;
  const keys = Object.keys(entries).filter((k) => k >= cutoffKey).sort();
  if (!keys.length) return 0;
  return Math.round(keys.reduce((a, k) => a + dayScore(entries[k]).score, 0) / keys.length);
}

export const ringColor = (p: number) => (p >= 70 ? "#16EC9A" : p >= 40 ? "#FFD60A" : "#FF5C5C");
