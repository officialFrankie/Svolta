import { NextResponse } from "next/server";

/**
 * FASE 2 — Notifiche push (Web Push su PWA iOS 16.4+), NON ancora attive.
 *
 * Flusso previsto:
 *  1. Il client chiede il permesso e registra una PushSubscription tramite il
 *     service worker (già presente in /sw.js, handler 'push' incluso).
 *  2. POST qui salva la subscription nel DB.
 *  3. Un cron (es. Vercel Cron alle 21:00) invia il promemoria "compila il
 *     diario" via web-push con chiavi VAPID.
 */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Notifiche push (Fase 2) non ancora attive." },
    { status: 501 }
  );
}
