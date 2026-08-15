/**
 * Esegue `prisma migrate deploy` scegliendo la connection string giusta.
 *
 * Su Neon (integrazione Vercel) DATABASE_URL punta di solito all'endpoint
 * POOLED (host con "-pooler", pgbouncer): va benissimo per l'app a runtime,
 * ma rompe le migration — `prisma migrate deploy` usa advisory lock Postgres
 * che il pooler in transaction mode non supporta (timeout in build).
 * Le migration devono usare la connessione DIRETTA: l'integrazione Neon la
 * espone come DATABASE_URL_UNPOOLED (o POSTGRES_URL_NON_POOLING).
 */
import { execSync } from "node:child_process";

const direct =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL;

if (!direct) {
  console.error(
    "✗ DATABASE_URL mancante. Su Vercel: Settings → Environment Variables → " +
      "verifica che DATABASE_URL (integrazione Neon) sia abilitata per gli ambienti " +
      "Production E Preview, poi rilancia il deploy."
  );
  process.exit(1);
}

const viaPooler = direct.includes("-pooler");
console.log(
  `→ prisma migrate deploy (connessione ${viaPooler ? "POOLED — nessuna variante diretta trovata, possibile timeout" : "diretta"})`
);

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: direct },
});
