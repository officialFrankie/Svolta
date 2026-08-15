import { NextRequest, NextResponse } from "next/server";
import { closeActiveGoal, getActiveGoal, setActiveGoal } from "@/lib/db";
import type { Roadmap } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const goal = await getActiveGoal();
    return NextResponse.json({ ok: true, goal });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Errore DB" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { title: string; deadline: string; roadmap: Roadmap };
    if (!body.title?.trim() || !body.deadline || !body.roadmap?.sections) {
      return NextResponse.json({ ok: false, error: "Obiettivo incompleto" }, { status: 400 });
    }
    const goal = await setActiveGoal(body.title.trim(), body.deadline, body.roadmap);
    return NextResponse.json({ ok: true, goal });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Errore salvataggio" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await closeActiveGoal();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Errore chiusura" },
      { status: 500 }
    );
  }
}
