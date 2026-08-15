import { NextResponse } from "next/server";
import { getActiveGoal, getAllEntries, getSettings } from "@/lib/db";
import { dayScore } from "@/lib/score";
import { HABITS, todayKey } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [entries, goal, settings] = await Promise.all([
      getAllEntries(),
      getActiveGoal(),
      getSettings(),
    ]);

    const keys = Object.keys(entries).sort();
    let md = `# Diario Svolta — Francesco\n\nExport: ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })}\nStop fumo: ${new Date(settings.quitAt).toLocaleString("it-IT")}\n\n`;

    if (goal) {
      md += `## Obiettivo attivo: ${goal.title} (entro ${goal.deadline})\n${goal.roadmap.summary}\n\n`;
      if (goal.roadmap.milestones.length) {
        md += `### Milestone\n${goal.roadmap.milestones.map((m, i) => `${i + 1}. **${m.label}** — ${m.detail}`).join("\n")}\n\n`;
      }
    }

    md += `## Finanze\n- Netto: €${settings.netSalary}/mese · Saldo: €${settings.balance} · PAC ETF: €${settings.investPlan}/mese (${settings.etfs}) · Rata TMAX: €${settings.tmaxRate}/mese · TFR: ~€${settings.tfr}\n\n`;

    for (const k of keys) {
      const e = entries[k];
      const s = dayScore(e);
      md += `## ${k} — Score ${s.score}%\n`;
      md += `- Fumo: ${e.noSmoke ? "pulito" : "RICADUTA"} | Craving resistiti: ${e.cravings} | Alcol: ${e.alcohol}\n`;
      md += `- Whoop: rec ${e.whoop.recovery || "–"}% | sonno ${e.whoop.sleepH || "–"}h | FCR ${e.whoop.fcr || "–"} | VFC ${e.whoop.vfc || "–"} | SpO2 ${e.whoop.spo2 || "–"}\n`;
      md += `- Allenamento: ${e.training.done ? e.training.type || "sì" : "riposo"}${e.training.minutes ? ` (${e.training.minutes}')` : ""} | Cibo ${e.foodQuality}/5: ${e.meals || "–"}\n`;
      md += `- Abitudini: ${HABITS.filter((h) => e.habits[h.id]).map((h) => h.label).join(", ") || "–"} | Umore ${e.mood}/5 | Ansia ${e.anxiety}/5\n`;
      const done = Object.values(e.goalTasks || {}).filter(Boolean).length;
      if (goal && done) md += `- Missione obiettivo: ${done} task completati\n`;
      if (e.notes) md += `- Note: ${e.notes}\n`;
      md += `\n`;
    }

    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="svolta-${todayKey()}.md"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Errore export" },
      { status: 500 }
    );
  }
}
