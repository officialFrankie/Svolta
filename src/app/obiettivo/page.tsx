"use client";

import { useState } from "react";
import Loading from "@/components/Loading";
import { Btn, Card, ErrorBox, SectionTitle, TextArea } from "@/components/ui";
import { api } from "@/lib/api";
import { daysToDeadline } from "@/lib/goalTasks";
import { useApp } from "@/lib/store";
import { C, SECTIONS, todayKey } from "@/lib/types";

type WizStage = "idle" | "input" | "loadingQ" | "questions" | "building";

export default function ObiettivoPage() {
  return (
    <Loading>
      <Obiettivo />
    </Loading>
  );
}

function Obiettivo() {
  const { goal, setGoal, closeGoal } = useApp();
  const [stage, setStage] = useState<WizStage>("idle");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [err, setErr] = useState("");

  const dtd = daysToDeadline(goal);
  const showWizard = !goal || stage !== "idle";

  const genQuestions = async () => {
    if (!title.trim() || !deadline) {
      setErr("Scrivi obiettivo e scadenza");
      return;
    }
    if (deadline <= todayKey()) {
      setErr("La scadenza deve essere nel futuro");
      return;
    }
    setErr("");
    setStage("loadingQ");
    const res = await api.coachIntake(title.trim(), deadline);
    if (res.ok) {
      setQuestions(res.questions);
      setAnswers({});
      setStage("questions");
    } else {
      setErr(res.error);
      setStage("input");
    }
  };

  const buildRoadmap = async () => {
    setErr("");
    setStage("building");
    const qa = questions.map((q, i) => ({ q, a: answers[i] || "" }));
    const res = await api.coachRoadmap(title.trim(), deadline, qa);
    if (!res.ok) {
      setErr(res.error);
      setStage("questions");
      return;
    }
    const saveErr = await setGoal(title.trim(), deadline, res.roadmap);
    if (saveErr) {
      setErr(saveErr);
      setStage("questions");
      return;
    }
    setStage("idle");
    setTitle("");
    setDeadline("");
    setQuestions([]);
    setAnswers({});
  };

  return (
    <>
      {goal && stage === "idle" && (
        <>
          <Card accent={C.orange}>
            <div className="flex items-baseline justify-between">
              <div className="text-base font-extrabold">🎯 {goal.title}</div>
              <div className="text-xs font-extrabold text-accorange">-{dtd} giorni</div>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-dim">{goal.roadmap.summary}</p>
          </Card>

          {goal.roadmap.milestones.length > 0 && (
            <>
              <SectionTitle>Milestone</SectionTitle>
              {goal.roadmap.milestones.map((m, i) => (
                <Card key={i} className="flex items-center gap-3 !p-3">
                  <div className="grid h-[34px] min-w-[34px] place-items-center rounded-[10px] font-extrabold text-accorange" style={{ background: `${C.orange}22` }}>
                    {i + 1}
                  </div>
                  <div>
                    <b className="text-sm">{m.label}</b>
                    <div className="text-[13px] text-dim">{m.detail}</div>
                  </div>
                </Card>
              ))}
            </>
          )}

          <SectionTitle>Target settimanali per sezione</SectionTitle>
          {SECTIONS.map((s) => {
            const wk = goal.roadmap.sections[s.id]?.weekly ?? [];
            if (!wk.length) return null;
            return (
              <Card key={s.id} className="!p-3">
                <div className="mb-1.5 text-xs font-extrabold" style={{ color: s.color }}>
                  {s.icon} {s.label.toUpperCase()}
                </div>
                {wk.map((w, i) => (
                  <div key={i} className="py-1 text-sm text-ink">
                    • {w}
                  </div>
                ))}
              </Card>
            );
          })}

          <Btn
            outline
            color={C.red}
            onClick={() => {
              if (window.confirm("Chiudere questo obiettivo?")) closeGoal();
            }}
          >
            Chiudi obiettivo
          </Btn>
          <Btn outline color={C.orange} onClick={() => setStage("input")}>
            Nuovo obiettivo (sostituisce)
          </Btn>
        </>
      )}

      {showWizard && (
        <>
          {(stage === "idle" || stage === "input" || stage === "loadingQ") && (
            <Card>
              <div className="mb-2.5 text-base font-extrabold">🎯 Crea obiettivo</div>
              <div className="mb-1 text-[11px] font-bold text-dim">
                OBIETTIVO (sii specifico: cosa, quanto)
              </div>
              <TextArea
                rows={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Viaggio a New York il 15 ottobre: +3kg massa muscolare e ansia sotto controllo"
              />
              <div className="mb-1 mt-3 text-[11px] font-bold text-dim">SCADENZA</div>
              <input
                type="date"
                value={deadline}
                min={todayKey()}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-line bg-cardsoft p-3 font-sans text-[15px] text-ink outline-none"
              />
              {err && <div className="mt-2 text-[13px] font-bold text-accred">{err}</div>}
              <div className="mt-3.5">
                <Btn color={C.orange} disabled={stage === "loadingQ"} onClick={genQuestions}>
                  {stage === "loadingQ"
                    ? "Il team prepara le domande…"
                    : "Avanti → il team ti farà le domande"}
                </Btn>
              </div>
            </Card>
          )}

          {(stage === "questions" || stage === "building") && (
            <Card>
              <div className="mb-1 text-base font-extrabold">📋 Intake del team</div>
              <p className="mb-3 text-[13px] text-dim">
                Più sei preciso, più la roadmap sarà su misura.
              </p>
              {questions.map((q, i) => (
                <div key={i} className="mb-3">
                  <div className="mb-1 text-[13px] font-bold">
                    {i + 1}. {q}
                  </div>
                  <TextArea
                    rows={1}
                    value={answers[i] || ""}
                    onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                  />
                </div>
              ))}
              {err && <div className="mb-2 text-[13px] font-bold text-accred">{err}</div>}
              <Btn color={C.orange} disabled={stage === "building"} onClick={buildRoadmap}>
                {stage === "building" ? "Il team costruisce la roadmap…" : "Crea la roadmap"}
              </Btn>
              {stage === "questions" && (
                <div className="mt-2">
                  <Btn outline color={C.dim} onClick={() => setStage(goal ? "idle" : "input")}>
                    ← Indietro
                  </Btn>
                </div>
              )}
            </Card>
          )}
          {err && stage === "idle" && <ErrorBox msg={err} />}
        </>
      )}
    </>
  );
}
