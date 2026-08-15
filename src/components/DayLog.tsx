"use client";

import { useRef, useState } from "react";
import { api, fileToB64 } from "@/lib/api";
import { dayScore } from "@/lib/score";
import { useApp } from "@/lib/store";
import { C, HABITS, emptyEntry, type Entry } from "@/lib/types";
import {
  BigToggle,
  Card,
  Chip,
  MiniInput,
  Scale,
  ScoreBar,
  SectionTitle,
  Stepper,
  TextArea,
} from "./ui";

/** Log completo di un giorno (oggi o passato): tutte le sezioni del prototipo. */
export default function DayLog({ date }: { date: string }) {
  const { entries, updateEntry } = useApp();
  const entry: Entry = entries[date] ?? emptyEntry(date);
  const setE = (patch: Partial<Entry>) => updateEntry(date, patch);

  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrMsg, setOcrMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const dayS = dayScore(entry);

  const importShots = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setOcrBusy(true);
    setOcrMsg("");
    try {
      const images = await Promise.all(
        Array.from(files)
          .slice(0, 4)
          .map(async (f) => ({ media_type: f.type || "image/png", data: await fileToB64(f) }))
      );
      const res = await api.coachWhoopVision(images);
      if (res.ok) {
        const w = res.whoop;
        setE({
          whoop: {
            recovery: w.recovery != null ? String(w.recovery) : entry.whoop.recovery,
            sleepH: w.sleepH != null ? String(w.sleepH) : entry.whoop.sleepH,
            fcr: w.fcr != null ? String(w.fcr) : entry.whoop.fcr,
            vfc: w.vfc != null ? String(w.vfc) : entry.whoop.vfc,
            spo2: w.spo2 != null ? String(w.spo2) : entry.whoop.spo2,
          },
        });
        setOcrMsg("✓ Dati Whoop importati");
      } else {
        setOcrMsg(res.error);
      }
    } catch (e) {
      setOcrMsg(`Errore: ${e instanceof Error ? e.message : "lettura fallita"}`);
    }
    setOcrBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <SectionTitle>Le due battaglie</SectionTitle>
      <div className="flex gap-2.5">
        <BigToggle
          on={entry.noSmoke}
          icon="🚭"
          onLabel="Niente fumo"
          offLabel="Ho fumato"
          onColor={C.green}
          offColor={C.red}
          onChange={(v) => setE({ noSmoke: v })}
        />
        <BigToggle
          on={entry.training.done}
          icon="🏋️"
          onLabel="Allenato"
          offLabel="Riposo"
          onColor={C.blue}
          offColor={C.dim}
          onChange={(v) => setE({ training: { ...entry.training, done: v } })}
        />
      </div>

      {entry.training.done && (
        <Card>
          <div className="flex flex-wrap gap-2">
            <MiniInput
              label="TIPO SEDUTA"
              value={entry.training.type}
              onChange={(v) => setE({ training: { ...entry.training, type: v } })}
            />
            <MiniInput
              label="MINUTI"
              value={entry.training.minutes}
              onChange={(v) => setE({ training: { ...entry.training, minutes: v } })}
              suffix="'"
            />
          </div>
        </Card>
      )}

      <Card className="flex gap-2">
        <Stepper
          label="🍺 Drink oggi"
          value={entry.alcohol}
          onChange={(v) => setE({ alcohol: v })}
          color={Number(entry.alcohol) === 0 ? C.green : Number(entry.alcohol) <= 2 ? C.yellow : C.red}
        />
        <Stepper
          label="💪 Craving resistiti"
          value={entry.cravings}
          onChange={(v) => setE({ cravings: v })}
          color={C.cyan}
        />
      </Card>

      <SectionTitle>Abitudini</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {HABITS.map((h) => (
          <Chip
            key={h.id}
            icon={h.icon}
            label={h.label}
            on={!!entry.habits[h.id]}
            onChange={(v) => setE({ habits: { ...entry.habits, [h.id]: v } })}
          />
        ))}
      </div>

      <SectionTitle>Whoop</SectionTitle>
      <Card>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => importShots(e.target.files)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={ocrBusy}
          className="mb-3 w-full rounded-xl py-[13px] text-sm font-extrabold"
          style={{
            border: `1.5px dashed ${C.cyan}`,
            background: `${C.cyan}12`,
            color: C.cyan,
            cursor: ocrBusy ? "default" : "pointer",
          }}
        >
          {ocrBusy ? "📷 Sto leggendo gli screenshot…" : "📷 Carica screenshot Whoop (auto-compila)"}
        </button>
        {ocrMsg && (
          <div
            className="mb-2.5 text-[13px] font-bold"
            style={{ color: ocrMsg.startsWith("✓") ? C.green : C.red }}
          >
            {ocrMsg}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <MiniInput label="RECUPERO %" value={entry.whoop.recovery} onChange={(v) => setE({ whoop: { ...entry.whoop, recovery: v } })} />
          <MiniInput label="SONNO H" value={entry.whoop.sleepH} onChange={(v) => setE({ whoop: { ...entry.whoop, sleepH: v } })} />
          <MiniInput label="FCR" value={entry.whoop.fcr} onChange={(v) => setE({ whoop: { ...entry.whoop, fcr: v } })} />
          <MiniInput label="VFC" value={entry.whoop.vfc} onChange={(v) => setE({ whoop: { ...entry.whoop, vfc: v } })} />
          <MiniInput label="SPO2 %" value={entry.whoop.spo2} onChange={(v) => setE({ whoop: { ...entry.whoop, spo2: v } })} />
        </div>
      </Card>

      <SectionTitle>Nutrizione</SectionTitle>
      <Card>
        <div className="mb-1.5 text-[11px] font-bold text-dim">QUALITÀ (1 schifo → 5 pulito)</div>
        <div className="mb-3 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setE({ foodQuality: n })}
              className="h-10 flex-1 rounded-xl text-base font-extrabold"
              style={{
                background: n <= entry.foodQuality ? C.green : C.cardSoft,
                boxShadow: `inset 0 0 0 1.5px ${n <= entry.foodQuality ? C.green : C.line}`,
                color: n <= entry.foodQuality ? "#0B1512" : C.dim,
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <TextArea
          value={entry.meals}
          onChange={(e) => setE({ meals: e.target.value })}
          rows={2}
          placeholder="Cosa hai mangiato oggi…"
        />
      </Card>

      <SectionTitle>Testa</SectionTitle>
      <Card>
        <Scale label="Umore" value={entry.mood} onChange={(n) => setE({ mood: n })} color={C.blue} />
        <Scale label="Ansia (5 = alta)" value={entry.anxiety} onChange={(n) => setE({ anxiety: n })} color={C.red} />
        <TextArea
          value={entry.notes}
          onChange={(e) => setE({ notes: e.target.value })}
          rows={2}
          placeholder="Note del giorno…"
        />
      </Card>

      <SectionTitle>Composizione dello score — {dayS.score}%</SectionTitle>
      <Card>
        {dayS.parts.map((p) => (
          <ScoreBar
            key={p.name}
            name={p.name}
            val={p.val}
            max={p.max}
            color={p.val / p.max >= 0.99 ? C.green : p.val > 0 ? C.yellow : C.line}
          />
        ))}
      </Card>
    </>
  );
}
