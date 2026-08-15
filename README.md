# SVOLTA

Il quartier generale personale di Francesco — health & life coaching. Dark, stile Whoop, mobile-first, installabile come PWA su iPhone.

Ricostruzione completa del prototipo `prototype/svolta-v3.tsx` come app vera: Next.js 14 (App Router) + TypeScript + Tailwind, PostgreSQL (Neon) via Prisma, API Anthropic solo lato server.

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
cp .env.example .env              # inserisci ANTHROPIC_API_KEY e DATABASE_URL
npx prisma migrate deploy         # applica le migration al DB Postgres
npm run dev                       # http://localhost:3000
```

Serve un PostgreSQL raggiungibile: il più comodo è un **branch di sviluppo del DB Neon** (dashboard Neon → Branches → copia la connection string), oppure un Postgres locale.

La chiave Anthropic vive **solo** in `.env` e viene usata **solo** dalla route server `/api/coach` (modello `claude-sonnet-4-6`). Il client non la vede mai.

## Deploy su Vercel

Il database è **PostgreSQL su Neon** (il filesystem di Vercel è effimero, quindi niente SQLite). Lo script di build esegue `prisma generate && prisma migrate deploy && next build`: a ogni deploy le migration pendenti vengono applicate automaticamente prima della build.

1. Su [vercel.com](https://vercel.com) il progetto è collegato al repo; la variabile `DATABASE_URL` è già fornita dall'integrazione Neon.
2. In **Settings → Environment Variables** verifica che ci siano:
   - `DATABASE_URL` (integrazione Neon)
   - `ANTHROPIC_API_KEY`
3. Deploy (o ri-deploy dell'ultimo commit). Fine.

Nota: se `DATABASE_URL` punta all'endpoint **pooled** di Neon (host `-pooler`) e `prisma migrate deploy` desse errori in build, usa la connection string **unpooled** (Neon la espone come `DATABASE_URL_UNPOOLED`) come valore di `DATABASE_URL`, oppure aggiungi nello schema un `directUrl` dedicato alle migration.

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
