import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toEntry, upsertEntry } from "@/lib/db";
import { emptyEntry, type Entry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(_req: NextRequest, { params }: { params: { date: string } }) {
  if (!DATE_RE.test(params.date)) {
    return NextResponse.json({ ok: false, error: "Data non valida" }, { status: 400 });
  }
  try {
    const row = await prisma.entry.findUnique({ where: { date: params.date } });
    return NextResponse.json({ ok: true, entry: row ? toEntry(row) : emptyEntry(params.date) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Errore DB" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { date: string } }) {
  if (!DATE_RE.test(params.date)) {
    return NextResponse.json({ ok: false, error: "Data non valida" }, { status: 400 });
  }
  try {
    const body = (await req.json()) as Entry;
    const saved = await upsertEntry({ ...body, date: params.date });
    return NextResponse.json({ ok: true, entry: saved });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Errore salvataggio" },
      { status: 500 }
    );
  }
}
