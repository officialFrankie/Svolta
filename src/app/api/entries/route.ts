import { NextResponse } from "next/server";
import { getAllEntries } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = await getAllEntries();
    return NextResponse.json({ ok: true, entries });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Errore DB" },
      { status: 500 }
    );
  }
}
