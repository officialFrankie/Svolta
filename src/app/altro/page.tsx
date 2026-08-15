"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import BenefitCard from "@/components/BenefitCard";
import Loading from "@/components/Loading";
import { Btn, Card, Ring, ScoreBar, SectionTitle } from "@/components/ui";
import { activeBenefits } from "@/lib/benefits";
import { dayScore, periodAvg, ringColor } from "@/lib/score";
import { useApp, useToday } from "@/lib/store";
import { C, fmtDate, hoursSince, todayKey } from "@/lib/types";

const VIEWS = [
  { id: "progressi", label: "Progressi" },
  { id: "benefici", label: "Benefici" },
  { id: "storico", label: "Storico" },
  { id: "impostazioni", label: "Impostazioni" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export default function AltroPage() {
  return (
    <Loading>
      <Suspense fallback={null}>
        <Altro />
      </Suspense>
    </Loading>
  );
}

function Altro() {
  const params = useSearchParams();
  const initial = (params.get("vista") as ViewId) || "progressi";
  const [view, setView] = useState<ViewId>(
    VIEWS.some((v) => v.id === initial) ? initial : "progressi"
  );

  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className="whitespace-nowrap rounded-full px-3.5 py-2.5 text-[13px] font-extrabold"
            style={{
              background: view === v.id ? `${C.blue}22` : C.cardSoft,
              boxShadow: `inset 0 0 0 1.5px ${view === v.id ? C.blue : C.line}`,
              color: view === v.id ? C.blue : C.dim,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "progressi" && <Progressi />}
      {view === "benefici" && <Benefici />}
      {view === "storico" && <Storico />}
      {view === "impostazioni" && <Impostazioni />}
    </>
  );
}

/* ---------- PROGRESSI ---------- */

function Progressi() {
  const { entries } = useApp();
  const allKeys = Object.keys(entries).sort();
  const weekS = periodAvg(entries, 7);
  const monthS = periodAvg(entries, 30);
  const last7 = allKeys.slice(-7).map((k) => entries[k]);

  return (
    <>
      <Card className="flex justify-around !px-2 !py-5">
        <Ring pct={weekS} color={C.blue} label="Settimana" size={104} />
        <Ring pct={monthS} color={C.violet} label="Mese" size={104} />
      </Card>

      <SectionTitle>Ultimi 14 giorni</SectionTitle>
      <Card>
        <div className="flex h-[100px] items-end gap-[5px]">
          {allKeys.slice(-14).map((k) => {
            const s = dayScore(entries[k]).score;
            return (
              <div key={k} className="flex flex-1 flex-col items-center gap-1">
                <div className="text-[10px] font-bold text-dim">{s}</div>
                <div
                  className="w-full rounded"
                  style={{ height: `${Math.max(4, s * 0.75)}px`, background: ringColor(s) }}
                />
                <span className="text-[9px] text-dim">{fmtDate(k)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <SectionTitle>Questa settimana</SectionTitle>
      <Card>
        <ScoreBar name="🚭 Giorni puliti" val={last7.filter((e) => e.noSmoke).length} max={7} color={C.green} />
        <ScoreBar name="🚫🍺 Giorni zero alcol" val={last7.filter((e) => Number(e.alcohol) === 0).length} max={5} color={C.cyan} />
        <ScoreBar name="🏋️ Allenamenti" val={last7.filter((e) => e.training.done).length} max={3} color={C.blue} />
        <ScoreBar name="😴 Notti ≥ 7h" val={last7.filter((e) => Number(e.whoop.sleepH) >= 7).length} max={5} color={C.violet} />
        <ScoreBar name="🥗 Cibo ≥ 4/5" val={last7.filter((e) => Number(e.foodQuality) >= 4).length} max={4} color={C.yellow} />
      </Card>
    </>
  );
}

/* ---------- BENEFICI ---------- */

function Benefici() {
  const { settings } = useApp();
  const { entry } = useToday();
  const benefits = activeBenefits(entry, hoursSince(settings.quitAt));
  return (
    <>
      <SectionTitle>Tutti i benefici di oggi</SectionTitle>
      {benefits.length === 0 && (
        <Card>
          <div className="text-dim">Registra le azioni di oggi per sbloccare i benefici.</div>
        </Card>
      )}
      {benefits.map((b, i) => (
        <BenefitCard key={i} b={b} />
      ))}
    </>
  );
}

/* ---------- STORICO ---------- */

function Storico() {
  const { entries } = useApp();
  const keys = Object.keys(entries).sort().reverse();
  const tk = todayKey();
  return (
    <>
      <SectionTitle>Storico — tocca un giorno per vedere o modificare</SectionTitle>
      {keys.map((k) => {
        const e = entries[k];
        const s = dayScore(e).score;
        const habits = Object.values(e.habits).filter(Boolean).length;
        return (
          <Link key={k} href={k === tk ? "/oggi" : `/giorno/${k}`}>
            <Card className="flex items-center justify-between !p-3">
              <div>
                <b className="text-sm">
                  {new Date(`${k}T12:00`).toLocaleDateString("it-IT", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  {k === tk ? " · oggi" : ""}
                </b>
                <div className="mt-0.5 text-xs text-dim">
                  {e.noSmoke ? "🚭 pulito" : "🚬 ricaduta"} · 🍺 {e.alcohol} ·{" "}
                  {e.training.done ? "🏋️ allenato" : "riposo"} · 🥗 {e.foodQuality}/5 · ✅ {habits}{" "}
                  abitudini
                </div>
              </div>
              <div
                className="grid h-11 w-11 place-items-center rounded-xl text-sm font-extrabold"
                style={{ background: `${ringColor(s)}22`, color: ringColor(s) }}
              >
                {s}
              </div>
            </Card>
          </Link>
        );
      })}
    </>
  );
}

/* ---------- IMPOSTAZIONI ---------- */

function Impostazioni() {
  const { settings, updateSettings } = useApp();
  const [resetArm, setResetArm] = useState(false);

  const download = () => {
    // l'API restituisce il .md come attachment: basta navigarci
    window.location.href = "/api/export";
  };

  const resetAll = async () => {
    if (!resetArm) {
      setResetArm(true);
      setTimeout(() => setResetArm(false), 4000);
      return;
    }
    if (!window.confirm("Sicuro? Cancella TUTTO il diario, l'obiettivo e le impostazioni.")) return;
    // niente endpoint dedicato: azzera giorno per giorno non serve, esporta prima!
    const res = await fetch("/api/reset", { method: "POST" });
    if (res.ok) window.location.reload();
    else alert("Reset fallito, riprova");
  };

  return (
    <>
      <SectionTitle>Impostazioni</SectionTitle>
      <Card>
        <div className="mb-1.5 text-[11px] font-bold text-dim">DATA E ORA ULTIMO FUMO</div>
        <input
          type="datetime-local"
          value={settings.quitAt}
          onChange={(e) => updateSettings({ quitAt: e.target.value })}
          className="w-full rounded-xl border border-line bg-cardsoft p-3 font-sans text-[15px] text-ink outline-none"
        />
      </Card>

      <Card>
        <div className="mb-2 text-[11px] font-bold text-dim">DATI FINANZIARI</div>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["netSalary", "Netto/mese €"],
              ["balance", "Saldo conto €"],
              ["investPlan", "PAC ETF €"],
              ["tmaxRate", "Rata TMAX €"],
              ["tfr", "TFR maturato €"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-[11px] font-bold text-dim">{label}</span>
              <input
                value={settings[key]}
                inputMode="decimal"
                onChange={(e) => updateSettings({ [key]: e.target.value })}
                className="mt-1 w-full rounded-xl border border-line bg-cardsoft p-2.5 text-[15px] font-bold text-ink outline-none"
              />
            </label>
          ))}
          <label className="col-span-2 block">
            <span className="text-[11px] font-bold text-dim">ETF DEL PAC</span>
            <input
              value={settings.etfs}
              onChange={(e) => updateSettings({ etfs: e.target.value })}
              className="mt-1 w-full rounded-xl border border-line bg-cardsoft p-2.5 text-[15px] font-bold text-ink outline-none"
            />
          </label>
        </div>
      </Card>

      <Btn outline onClick={download}>
        ⬇ Scarica diario (.md)
      </Btn>
      <Btn outline color={C.red} onClick={resetAll}>
        {resetArm ? "⚠️ Tocca di nuovo per confermare il reset" : "🗑 Reset completo"}
      </Btn>

      <Card className="!p-3">
        <div className="text-xs leading-relaxed text-dim">
          <b className="text-ink">Fase 2 (in preparazione):</b> sync automatico Whoop via API
          ufficiale (OAuth2) e notifiche push. La struttura è già predisposta in
          /api/whoop e /api/push.
        </div>
      </Card>
    </>
  );
}
