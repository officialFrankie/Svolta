"use client";

import { useState } from "react";
import GoalTaskItem from "@/components/GoalTaskItem";
import Loading from "@/components/Loading";
import { Btn, Card, MiniInput, ScoreBar } from "@/components/ui";
import { api } from "@/lib/api";
import { useApp, useToday } from "@/lib/store";
import { C, SECTIONS, hoursSince, type SectionId } from "@/lib/types";

export default function SezioniPage() {
  return (
    <Loading>
      <Sezioni />
    </Loading>
  );
}

function Sezioni() {
  const { entries, goal, settings, updateSettings } = useApp();
  const { entry, setE } = useToday();
  const [secTab, setSecTab] = useState<SectionId>("nutrizione");
  const [texts, setTexts] = useState<Partial<Record<SectionId, string>>>({});
  const [busy, setBusy] = useState<SectionId | "">("");
  const [errs, setErrs] = useState<Partial<Record<SectionId, string>>>({});

  const s = SECTIONS.find((x) => x.id === secTab)!;
  const hours = hoursSince(settings.quitAt);
  const allKeys = Object.keys(entries).sort();
  const secGoal = goal?.roadmap.sections[secTab];

  const net = Number(settings.netSalary) || 0;
  const fixed = Number(settings.tmaxRate) || 0;
  const invest = Number(settings.investPlan) || 0;
  const free = net - fixed - invest;
  const investPct = net ? Math.round((invest / net) * 100) : 0;
  const balance = Number(settings.balance) || 0;

  const ask = async (id: SectionId) => {
    setBusy(id);
    setErrs((p) => ({ ...p, [id]: "" }));
    const res = await api.coachSpecialist(id);
    if (res.ok) setTexts((p) => ({ ...p, [id]: res.text }));
    else setErrs((p) => ({ ...p, [id]: res.error }));
    setBusy("");
  };

  const toggleTask = (id: string) =>
    setE({ goalTasks: { ...entry.goalTasks, [id]: !entry.goalTasks?.[id] } });

  return (
    <>
      {/* selettore specialista */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {SECTIONS.map((x) => (
          <button
            key={x.id}
            onClick={() => setSecTab(x.id)}
            className="whitespace-nowrap rounded-full px-3.5 py-2.5 text-[13px] font-extrabold"
            style={{
              background: secTab === x.id ? `${x.color}22` : C.cardSoft,
              boxShadow: `inset 0 0 0 1.5px ${secTab === x.id ? x.color : C.line}`,
              color: secTab === x.id ? x.color : C.dim,
            }}
          >
            {x.icon} {x.label}
          </button>
        ))}
      </div>

      {/* stato rilevante per sezione */}
      {secTab === "nutrizione" && (
        <Card>
          <ScoreBar name="Qualità cibo oggi" val={entry.foodQuality} max={5} color={C.green} />
          <div className="text-[13px] text-dim">
            {entry.meals || "Nessun pasto registrato oggi — segnalo nella tab Oggi."}
          </div>
        </Card>
      )}

      {secTab === "training" && (
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
          <div className="mt-2 text-[13px] text-dim">
            Ultimi 7 giorni: {allKeys.slice(-7).filter((k) => entries[k].training.done).length}{" "}
            allenamenti · Recupero oggi: {entry.whoop.recovery || "–"}%
          </div>
        </Card>
      )}

      {secTab === "mente" && (
        <Card>
          <ScoreBar name="Umore oggi" val={entry.mood} max={5} color={C.blue} />
          <ScoreBar name="Ansia oggi (meno è meglio)" val={entry.anxiety} max={5} color={C.red} />
          <div className="mt-2 text-[13px] text-dim">
            Craving resistiti oggi: {entry.cravings} · Senza fumo: {Math.floor(hours / 24)}g{" "}
            {Math.floor(hours % 24)}h
          </div>
        </Card>
      )}

      {secTab === "finanze" && (
        <>
          <Card>
            <div className="flex flex-wrap gap-2">
              <MiniInput label="NETTO MESE" prefix="€" value={settings.netSalary} onChange={(v) => updateSettings({ netSalary: v })} />
              <MiniInput label="SALDO CONTO" prefix="€" value={settings.balance} onChange={(v) => updateSettings({ balance: v })} />
              <MiniInput label="PAC ETF MESE" prefix="€" value={settings.investPlan} onChange={(v) => updateSettings({ investPlan: v })} />
              <MiniInput label="RATA TMAX" prefix="€" value={settings.tmaxRate} onChange={(v) => updateSettings({ tmaxRate: v })} />
            </div>
          </Card>
          <Card>
            <ScoreBar name={`PAC ETF (${settings.etfs})`} val={invest} max={net || 1} color={C.yellow} />
            <div className="mb-2.5 text-[13px] text-dim">
              = {investPct}% del netto · dopo rata e PAC restano{" "}
              <b className="text-ink">€{free}</b>/mese per tutto il resto
            </div>
            <ScoreBar
              name="Fondo emergenza (target 3 mesi ≈ €5.300)"
              val={balance}
              max={5300}
              color={balance >= 5300 ? C.green : C.orange}
            />
            <div className="text-[13px] text-dim">
              TFR maturato in azienda: ~€{settings.tfr} — è tuo ma non liquido.
            </div>
          </Card>
        </>
      )}

      {/* task e target della roadmap per questa sezione */}
      {secGoal && (
        <Card accent={s.color}>
          <div className="mb-2 text-xs font-extrabold" style={{ color: s.color }}>
            🎯 DALLA ROADMAP
          </div>
          {(secGoal.daily ?? []).map((task, i) => {
            const id = `${secTab}-${i}`;
            return (
              <GoalTaskItem
                key={id}
                task={task}
                done={!!entry.goalTasks?.[id]}
                color={s.color}
                onToggle={() => toggleTask(id)}
              />
            );
          })}
          {(secGoal.weekly ?? []).length > 0 && (
            <div className="mt-2 text-xs text-dim">Settimana: {(secGoal.weekly ?? []).join(" · ")}</div>
          )}
        </Card>
      )}

      <Btn color={s.color} disabled={busy === secTab} onClick={() => ask(secTab)}>
        {busy === secTab ? "Sto analizzando…" : `Chiedi al ${s.label.toLowerCase()}`}
      </Btn>

      {errs[secTab] && (
        <div className="text-[13px] font-bold text-accred">
          {errs[secTab]}{" "}
          <button className="underline" onClick={() => ask(secTab)}>
            Riprova
          </button>
        </div>
      )}

      {texts[secTab] && (
        <Card accent={s.color}>
          <div className="whitespace-pre-wrap text-[14.5px] leading-[1.65]">{texts[secTab]}</div>
        </Card>
      )}
    </>
  );
}
