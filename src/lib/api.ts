// Helper fetch lato client: mai throw non gestiti, errori sempre come stringa.

import type { Entry, Goal, Roadmap, SectionId, Settings, WhoopData } from "./types";

type Ok<T> = { ok: true } & T;
type Err = { ok: false; error: string };

async function call<T>(url: string, init?: RequestInit): Promise<Ok<T> | Err> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const data = await res.json().catch(() => null);
    if (!data) return { ok: false, error: `Risposta non valida (HTTP ${res.status})` };
    if (!res.ok || data.ok === false) {
      return { ok: false, error: data.error || `Errore HTTP ${res.status}` };
    }
    return data as Ok<T>;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore di rete" };
  }
}

export const api = {
  getEntries: () => call<{ entries: Record<string, Entry> }>("/api/entries"),
  saveEntry: (entry: Entry) =>
    call<{ entry: Entry }>(`/api/entries/${entry.date}`, {
      method: "PUT",
      body: JSON.stringify(entry),
    }),
  getGoal: () => call<{ goal: Goal | null }>("/api/goal"),
  saveGoal: (title: string, deadline: string, roadmap: Roadmap) =>
    call<{ goal: Goal }>("/api/goal", {
      method: "PUT",
      body: JSON.stringify({ title, deadline, roadmap }),
    }),
  closeGoal: () => call<Record<string, never>>("/api/goal", { method: "DELETE" }),
  getSettings: () => call<{ settings: Settings }>("/api/settings"),
  saveSettings: (patch: Partial<Settings>) =>
    call<{ settings: Settings }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
  coachIntake: (title: string, deadline: string) =>
    call<{ questions: string[] }>("/api/coach", {
      method: "POST",
      body: JSON.stringify({ action: "intake", title, deadline }),
    }),
  coachRoadmap: (title: string, deadline: string, qa: { q: string; a: string }[]) =>
    call<{ roadmap: Roadmap }>("/api/coach", {
      method: "POST",
      body: JSON.stringify({ action: "roadmap", title, deadline, qa }),
    }),
  coachSpecialist: (section: SectionId) =>
    call<{ text: string }>("/api/coach", {
      method: "POST",
      body: JSON.stringify({ action: "specialist", section }),
    }),
  coachWhoopVision: (images: { media_type: string; data: string }[]) =>
    call<{ whoop: Record<keyof WhoopData, number | null> }>("/api/coach", {
      method: "POST",
      body: JSON.stringify({ action: "whoop-vision", images }),
    }),
};

export const fileToB64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = () => reject(new Error("Lettura file fallita"));
    r.readAsDataURL(file);
  });
