import { NextRequest, NextResponse } from "next/server";
import { callClaude, type ContentBlock } from "@/lib/anthropic";
import { getActiveGoal, getAllEntries, getSettings } from "@/lib/db";
import { extractJSON } from "@/lib/json";
import {
  intakePrompt,
  roadmapPrompt,
  specialistPrompt,
  WHOOP_VISION_PROMPT,
} from "@/lib/prompts";
import { hoursSince, todayKey, type Roadmap, type SectionId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SECTION_IDS: SectionId[] = ["nutrizione", "training", "mente", "finanze"];

type CoachBody =
  | { action: "intake"; title: string; deadline: string }
  | { action: "roadmap"; title: string; deadline: string; qa: { q: string; a: string }[] }
  | { action: "specialist"; section: SectionId }
  | { action: "whoop-vision"; images: { media_type: string; data: string }[] };

const err = (message: string, status = 400) =>
  NextResponse.json({ ok: false, error: message }, { status });

export async function POST(req: NextRequest) {
  let body: CoachBody;
  try {
    body = await req.json();
  } catch {
    return err("Body JSON non valido");
  }

  try {
    const settings = await getSettings();
    const hours = hoursSince(settings.quitAt);
    const today = todayKey();

    switch (body.action) {
      case "intake": {
        const { title, deadline } = body;
        if (!title?.trim() || !deadline) return err("Servono obiettivo e scadenza");
        const txt = await callClaude(intakePrompt(settings, hours, title.trim(), deadline, today), {
          maxTokens: 900,
        });
        const questions = extractJSON<string[]>(txt);
        if (!Array.isArray(questions) || !questions.length || !questions.every((q) => typeof q === "string")) {
          return err("L'AI non ha prodotto domande valide, riprova", 502);
        }
        return NextResponse.json({ ok: true, questions: questions.slice(0, 9) });
      }

      case "roadmap": {
        const { title, deadline, qa } = body;
        if (!title?.trim() || !deadline || !Array.isArray(qa)) return err("Dati intake incompleti");
        const txt = await callClaude(roadmapPrompt(settings, hours, title.trim(), deadline, today, qa), {
          maxTokens: 2500,
        });
        const rm = extractJSON<Roadmap>(txt);
        if (!rm || typeof rm.summary !== "string" || !rm.sections) {
          return err("Roadmap non valida dall'AI, riprova", 502);
        }
        // Normalizza: solo sezioni note, array di stringhe, limiti rispettati
        const sections: Roadmap["sections"] = {};
        for (const id of SECTION_IDS) {
          const s = rm.sections[id];
          if (!s) continue;
          sections[id] = {
            daily: (Array.isArray(s.daily) ? s.daily : []).filter((x) => typeof x === "string").slice(0, 4),
            weekly: (Array.isArray(s.weekly) ? s.weekly : []).filter((x) => typeof x === "string").slice(0, 3),
          };
        }
        const roadmap: Roadmap = {
          summary: rm.summary,
          sections,
          milestones: (Array.isArray(rm.milestones) ? rm.milestones : [])
            .filter((m) => m && typeof m.label === "string")
            .map((m) => ({ label: m.label, detail: String(m.detail ?? "") }))
            .slice(0, 10),
        };
        return NextResponse.json({ ok: true, roadmap });
      }

      case "specialist": {
        const { section } = body;
        if (!SECTION_IDS.includes(section)) return err("Sezione sconosciuta");
        const [entries, goal] = await Promise.all([getAllEntries(), getActiveGoal()]);
        const txt = await callClaude(specialistPrompt(section, settings, hours, entries, goal), {
          maxTokens: 1200,
        });
        return NextResponse.json({ ok: true, text: txt });
      }

      case "whoop-vision": {
        const { images } = body;
        if (!Array.isArray(images) || !images.length) return err("Nessuna immagine ricevuta");
        const blocks: ContentBlock[] = images.slice(0, 4).map((img) => ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: img.media_type || "image/png",
            data: img.data,
          },
        }));
        blocks.push({ type: "text", text: WHOOP_VISION_PROMPT });
        const txt = await callClaude(blocks, { maxTokens: 400 });
        const j = extractJSON<Record<string, number | null>>(txt);
        if (!j || typeof j !== "object") {
          return err("Non sono riuscito a leggere i valori dagli screenshot, riprova", 502);
        }
        const num = (v: unknown) => (v == null || v === "" || isNaN(Number(v)) ? null : Number(v));
        return NextResponse.json({
          ok: true,
          whoop: {
            recovery: num(j.recovery),
            sleepH: num(j.sleepH),
            fcr: num(j.fcr),
            vfc: num(j.vfc),
            spo2: num(j.spo2),
          },
        });
      }

      default:
        return err("Azione sconosciuta");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore imprevisto";
    return err(`Errore AI: ${msg}`, 502);
  }
}
