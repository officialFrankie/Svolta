// ---- Tipi condivisi client/server ----

export type WhoopData = {
  recovery: string;
  sleepH: string;
  fcr: string;
  vfc: string;
  spo2: string;
};

export type Entry = {
  date: string; // YYYY-MM-DD
  noSmoke: boolean;
  cravings: number;
  alcohol: number;
  training: { done: boolean; type: string; minutes: string };
  foodQuality: number;
  meals: string;
  habits: Record<string, boolean>;
  goalTasks: Record<string, boolean>;
  whoop: WhoopData;
  mood: number;
  anxiety: number;
  notes: string;
};

export type RoadmapSection = { daily: string[]; weekly: string[] };

export type Roadmap = {
  summary: string;
  sections: Partial<Record<SectionId, RoadmapSection>>;
  milestones: { label: string; detail: string }[];
};

export type Goal = {
  id: number;
  title: string;
  deadline: string; // YYYY-MM-DD
  roadmap: Roadmap;
  createdAt: string;
};

export type Settings = {
  quitAt: string; // datetime-local, es. 2026-08-10T20:00
  netSalary: string;
  balance: string;
  investPlan: string;
  tmaxRate: string;
  tfr: string;
  etfs: string;
};

export type SectionId = "nutrizione" | "training" | "mente" | "finanze";

export const SECTIONS: { id: SectionId; label: string; icon: string; color: string }[] = [
  { id: "nutrizione", label: "Nutrizionista", icon: "🥗", color: "#16EC9A" },
  { id: "training", label: "Trainer", icon: "🏋️", color: "#4A9DFF" },
  { id: "mente", label: "Mente", icon: "🧠", color: "#B58CFF" },
  { id: "finanze", label: "Finanze", icon: "💶", color: "#FFD60A" },
];

export const HABITS = [
  { id: "coldShower", label: "Doccia fredda", icon: "🚿" },
  { id: "walk", label: "Camminata 30'+", icon: "🚶" },
  { id: "breath", label: "Respirazione 4-8", icon: "🌬" },
  { id: "water", label: "Acqua 2L+", icon: "💧" },
  { id: "reading", label: "Lettura 15'+", icon: "📖" },
] as const;

export type HabitId = (typeof HABITS)[number]["id"];

// Palette (stile Whoop, dal prototipo)
export const C = {
  bg: "#101318",
  card: "#191E26",
  cardSoft: "#20262F",
  line: "#2B333E",
  ink: "#F2F5F8",
  dim: "#93A0AE",
  blue: "#4A9DFF",
  green: "#16EC9A",
  yellow: "#FFD60A",
  red: "#FF5C5C",
  violet: "#B58CFF",
  cyan: "#3ED6E0",
  orange: "#FF9F45",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  quitAt: "2026-08-10T20:00",
  netSalary: "2028",
  balance: "1800",
  investPlan: "250",
  tmaxRate: "250",
  tfr: "6700",
  etfs: "S&P 500 · MSCI World · MSCI EM",
};

export const emptyEntry = (date: string): Entry => ({
  date,
  noSmoke: true,
  cravings: 0,
  alcohol: 0,
  training: { done: false, type: "", minutes: "" },
  foodQuality: 0,
  meals: "",
  habits: {},
  goalTasks: {},
  whoop: { recovery: "", sleepH: "", fcr: "", vfc: "", spo2: "" },
  mood: 3,
  anxiety: 3,
  notes: "",
});

export const todayKey = (d = new Date()): string => {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export const fmtDate = (k: string) => `${k.slice(8)}/${k.slice(5, 7)}`;

export const hoursSince = (quitAt: string) =>
  Math.max(0, (Date.now() - new Date(quitAt).getTime()) / 36e5);
