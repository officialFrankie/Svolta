import { NextResponse } from "next/server";

/**
 * FASE 2 — Whoop API ufficiale (OAuth2), NON ancora attiva.
 *
 * Flusso previsto:
 *  1. GET /api/whoop/auth  → redirect a https://api.prod.whoop.com/oauth/oauth2/auth
 *     con client_id, redirect_uri, scope (read:recovery read:sleep read:cycles
 *     read:body_measurement), state anti-CSRF.
 *  2. GET /api/whoop/callback → scambia il code con access+refresh token
 *     (POST https://api.prod.whoop.com/oauth/oauth2/token) e li salva nel DB.
 *  3. Un job giornaliero (o un bottone "Sync") legge recovery/sleep del giorno
 *     e compila i campi Whoop dell'Entry senza screenshot.
 *
 * Variabili d'ambiente già predisposte in .env.example:
 * WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, WHOOP_REDIRECT_URI.
 */
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Integrazione Whoop (Fase 2) non ancora attiva." },
    { status: 501 }
  );
}
