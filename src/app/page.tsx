"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BenefitCard from "@/components/BenefitCard";
import GoalTaskItem from "@/components/GoalTaskItem";
import Loading from "@/components/Loading";
import { Card, Ring, SectionTitle } from "@/components/ui";
import { activeBenefits } from "@/lib/benefits";
import { daysToDeadline, missionStats } from "@/lib/goalTasks";
import { dayScore, ringColor } from "@/lib/score";
import { useApp, useToday } from "@/lib/store";
import { C, SECTIONS, hoursSince } from "@/lib/types";

export default function HomePage() {
  return (
    <Loading>
      <Home />
    </Loading>
  );
}

function Home() {
  const { goal, settings } = useApp();
  const { entry, setE } = useToday();

  // contatore live: aggiorna ogni minuto
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const hours = hoursSince(settings.quitAt);
  const dayS = dayScore(entry);
  const { tasks, done, pct } = missionStats(goal, entry);
  const dtd = daysToDeadline(goal);
  const benefits = activeBenefits(entry, hours);

  const toggleTask = (id: string) =>
    setE({ goalTasks: { ...entry.goalTasks, [id]: !entry.goalTasks?.[id] } });

  return (
    <>
      {/* contatore senza fumo */}
      <Card
        className="flex items-center justify-between !py-3"
        style={{ background: `linear-gradient(90deg, ${C.card}, #16281F)` }}
      >
        <div className="text-[13px] font-bold text-dim">🚭 SENZA FUMO</div>
        <div className="text-xl font-extrabold text-accgreen">
          {Math.floor(hours / 24)}g {Math.floor(hours % 24)}h
        </div>
      </Card>

      {/* anelli */}
      <Card className="flex justify-around !px-2 !py-5">
        <Ring pct={dayS.score} color={ringColor(dayS.score)} label="Svolta oggi" size={124} />
        {goal && <Ring pct={pct} color={C.orange} label="Missione oggi" size={124} />}
      </Card>

      {goal ? (
        <>
          <Card accent={C.orange}>
            <div className="flex items-baseline justify-between">
              <div className="text-[15px] font-extrabold">🎯 {goal.title}</div>
              <div className="text-xs font-extrabold text-accorange">-{dtd}g</div>
            </div>
          </Card>

          <SectionTitle>
            Missione di oggi — {done}/{tasks.length}
          </SectionTitle>
          {SECTIONS.map((s) => {
            const secTasks = tasks.filter((t) => t.section.id === s.id);
            if (!secTasks.length) return null;
            return (
              <Card key={s.id} className="!p-3">
                <div className="mb-2 text-xs font-extrabold" style={{ color: s.color }}>
                  {s.icon} {s.label.toUpperCase()}
                </div>
                {secTasks.map((t) => (
                  <GoalTaskItem
                    key={t.id}
                    task={t.task}
                    done={!!entry.goalTasks?.[t.id]}
                    color={s.color}
                    onToggle={() => toggleTask(t.id)}
                  />
                ))}
              </Card>
            );
          })}
        </>
      ) : (
        <Link href="/obiettivo">
          <Card accent={C.orange} className="!p-5 text-center">
            <div className="text-[26px]">🎯</div>
            <div className="mt-1 font-extrabold">Nessun obiettivo attivo</div>
            <div className="mt-0.5 text-[13px] text-dim">
              Creane uno: il team ti farà le domande e costruirà la roadmap
            </div>
          </Card>
        </Link>
      )}

      {benefits.length > 0 && (
        <>
          <SectionTitle>Il tuo corpo oggi</SectionTitle>
          {benefits.slice(0, 2).map((b, i) => (
            <BenefitCard key={i} b={b} />
          ))}
          {benefits.length > 2 && (
            <Link
              href="/altro?vista=benefici"
              className="text-center text-[13px] font-bold text-accblue"
            >
              +{benefits.length - 2} altri benefici →
            </Link>
          )}
        </>
      )}
    </>
  );
}
