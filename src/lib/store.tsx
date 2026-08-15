"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import {
  DEFAULT_SETTINGS,
  emptyEntry,
  todayKey,
  type Entry,
  type Goal,
  type Roadmap,
  type Settings,
} from "./types";

type Store = {
  loading: boolean;
  loadError: string;
  entries: Record<string, Entry>;
  goal: Goal | null;
  settings: Settings;
  saveFlash: string;
  /** merge parziale su un giorno, salvataggio ottimistico + debounce */
  updateEntry: (date: string, patch: Partial<Entry>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setGoal: (title: string, deadline: string, roadmap: Roadmap) => Promise<string | null>;
  closeGoal: () => Promise<void>;
  reload: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [goal, setGoalState] = useState<Goal | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saveFlash, setSaveFlash] = useState("");

  const entryTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const settingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const flash = useCallback((msg: string) => {
    setSaveFlash(msg);
    setTimeout(() => setSaveFlash(""), 1600);
  }, []);

  const reload = useCallback(async () => {
    setLoadError("");
    const [e, g, s] = await Promise.all([api.getEntries(), api.getGoal(), api.getSettings()]);
    if (!e.ok || !g.ok || !s.ok) {
      const firstErr = [e, g, s].find((r) => !r.ok) as { error: string };
      setLoadError(firstErr.error);
      setLoading(false);
      return;
    }
    const tk = todayKey();
    const map = { ...e.entries };
    if (!map[tk]) map[tk] = emptyEntry(tk);
    setEntries(map);
    setGoalState(g.goal);
    setSettings(s.settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateEntry = useCallback(
    (date: string, patch: Partial<Entry>) => {
      setEntries((prev) => {
        const base = prev[date] ?? emptyEntry(date);
        return { ...prev, [date]: { ...base, ...patch, date } };
      });
      if (entryTimers.current[date]) clearTimeout(entryTimers.current[date]);
      entryTimers.current[date] = setTimeout(async () => {
        const current = entriesRef.current[date];
        if (!current) return;
        const res = await api.saveEntry(current);
        flash(res.ok ? "✓ salvato" : "⚠︎ non salvato");
      }, 600);
    },
    [flash]
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      if (settingsTimer.current) clearTimeout(settingsTimer.current);
      settingsTimer.current = setTimeout(async () => {
        const res = await api.saveSettings(settingsRef.current);
        flash(res.ok ? "✓ salvato" : "⚠︎ non salvato");
      }, 600);
    },
    [flash]
  );

  const setGoal = useCallback(async (title: string, deadline: string, roadmap: Roadmap) => {
    const res = await api.saveGoal(title, deadline, roadmap);
    if (!res.ok) return res.error;
    setGoalState(res.goal);
    return null;
  }, []);

  const closeGoal = useCallback(async () => {
    await api.closeGoal();
    setGoalState(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        loading,
        loadError,
        entries,
        goal,
        settings,
        saveFlash,
        updateEntry,
        updateSettings,
        setGoal,
        closeGoal,
        reload,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp va usato dentro <AppProvider>");
  return ctx;
}

/** Entry di oggi (creata al volo se manca) + updater comodo. */
export function useToday() {
  const { entries, updateEntry } = useApp();
  const tk = todayKey();
  const entry = entries[tk] ?? emptyEntry(tk);
  const setE = (patch: Partial<Entry>) => updateEntry(tk, patch);
  return { tk, entry, setE };
}
