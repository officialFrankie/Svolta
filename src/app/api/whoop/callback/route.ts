import { NextResponse } from "next/server";

/** FASE 2 — callback OAuth2 Whoop. Vedi /api/whoop/auth per il flusso previsto. */
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Integrazione Whoop (Fase 2) non ancora attiva." },
    { status: 501 }
  );
}
