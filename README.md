# SVOLTA

Il quartier generale personale di Francesco — health & life coaching. Dark, stile Whoop, mobile-first, installabile come PWA su iPhone.

Ricostruzione completa del prototipo `prototype/svolta-v3.tsx` come app vera: Next.js 14 (App Router) + TypeScript + Tailwind, SQLite via Prisma, API Anthropic solo lato server.

## Funzionalità

- **Home** — contatore live senza fumo, anello "Svolta oggi", anello "Missione oggi" (task roadmap), obiettivo attivo con countdown, primi benefici del giorno.
- **Oggi** — log giornaliero: fumo/allenamento, drink e craving, chips abitudini, campi Whoop con **auto-compilazione da screenshot via AI vision**, qualità cibo, umore/ansia, note, composizione dello score.
- **Svolta Score (0-100)** — fumo 30 · alcol 20 · movimento 20 · nutrizione 15 · sonno 10 · mente 5. Medie 7/30 giorni negli anelli Settimana/Mese (tab Progressi).
- **Obiettivo** — wizard AI: obiettivo + scadenza → 6-9 domande di intake → roadmap JSON (summary onesta, milestone settimanali, task giornalieri per sezione che alimentano l'anello Missione).
- **Sezioni** — 4 specialisti AI (Nutrizionista, Trainer, Mente, Finanze), ognuno con TUTTO il contesto: diario, Whoop, roadmap, finanze, profilo completo.
- **Benefici** — card "ORA →" / "SE CONTINUI →" per ogni azione registrata; il beneficio del non fumare segue le ore reali dallo stop.
- **Progressi / Storico / Impostazioni** — grafico 14 giorni, contatori settimanali, modifica giorni passati, export .md, reset.

## Setup locale

```bash
npm install
cp .env.example .env.local        # inserisci la tua ANTHROPIC_API_KEY
echo 'DATABASE_URL="file:./dev.db"' > .env   # Prisma CLI legge .env
npx prisma migrate dev            # crea il DB SQLite
npm run dev                       # http://localhost:3000
```

La chiave Anthropic vive **solo** in `.env.local` e viene usata **solo** dalla route server `/api/coach` (modello `claude-sonnet-4-6`). Il client non la vede mai.

## Deploy su Vercel

Il filesystem di Vercel è **effimero**: un file SQLite verrebbe azzerato a ogni deploy/cold start. Per questo l'app supporta due modalità con lo stesso schema:

- **Locale / server proprio** → SQLite puro (`DATABASE_URL=file:./dev.db`), zero servizi esterni.
- **Vercel** → Turso (SQLite gestito, piano free): se `TURSO_DATABASE_URL` è presente, `src/lib/prisma.ts` usa l'adapter libSQL automaticamente.

Passi:

1. Crea il DB Turso (una tantum):
   ```bash
   turso db create svolta
   turso db show svolta --url          # → TURSO_DATABASE_URL
   turso db tokens create svolta       # → TURSO_AUTH_TOKEN
   turso db shell svolta < prisma/migrations/*/migration.sql
   ```
2. Su [vercel.com](https://vercel.com) → **Add New Project** → importa questo repo GitHub. Framework: Next.js (auto).
3. In **Settings → Environment Variables** aggiungi:
   - `ANTHROPIC_API_KEY`
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `DATABASE_URL` = `file:./dev.db` (serve solo a far felice `prisma generate` in build)
4. Deploy. Fine.

In alternativa, per restare 100% SQLite-file senza servizi esterni: deploy su un host con disco persistente (Fly.io, Railway, un VPS) usando `npm run build && npm start`.

## Installazione come PWA su iPhone

1. Apri l'URL dell'app in **Safari** (deve essere HTTPS — Vercel lo è già).
2. Tocca il tasto **Condividi** (quadrato con freccia in su).
3. **Aggiungi a schermata Home** → conferma.
4. L'icona SVOLTA (anello verde) appare in Home: si apre a schermo intero, senza barra Safari, con splash dark.

## Struttura

```
prisma/schema.prisma      Entry (1 riga/giorno) · Goal · Settings (singleton)
src/lib/                  score, benefici, prompt (profilo completo), store client
src/app/api/coach         unica route AI: intake | roadmap | specialist | whoop-vision
src/app/api/...           entries, goal, settings, export (.md), reset
src/app/                  / (Home) · /oggi · /obiettivo · /sezioni · /altro · /giorno/[date]
public/                   manifest, sw.js, icone (rigenerabili con `npm run icons`)
```

## Fase 2 (struttura già predisposta, non attiva)

- **Whoop API ufficiale (OAuth2)** — stub in `/api/whoop/auth` e `/api/whoop/callback` con il flusso documentato; env in `.env.example`.
- **Notifiche push** — stub in `/api/push/subscribe`; il service worker ha già gli handler `push` e `notificationclick`.
