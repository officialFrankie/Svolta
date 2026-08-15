import { HABITS, type Entry } from "./types";

export type Benefit = {
  icon: string;
  title: string;
  now: string;
  next: string;
  hero?: boolean;
};

/* Timeline del non-fumo: il beneficio cambia in base alle ORE reali dallo stop. */
const SMOKE_TIMELINE = [
  { maxH: 24, now: "Nicotina in smaltimento rapido, ossigeno a pieno regime.", next: "Domani: nicotina ematica a zero, battito stabilmente più basso." },
  { maxH: 72, now: "Nicotina a zero. Gusto e olfatto in rigenerazione, battito ~20% più basso.", next: "I bronchi iniziano a rilassarsi: respiro più libero." },
  { maxH: 168, now: "Cotinina azzerata: il craving è solo abitudine, non chimica.", next: "Se continui: la nebbia mentale si dirada, l'energia risale." },
  { maxH: 336, now: "Recettori nicotinici in spegnimento, dopamina naturale in ripresa.", next: "Verso il g14: craving rari e deboli, sonno più profondo." },
  { maxH: 720, now: "Circolazione in netto miglioramento, funzione polmonare in salita.", next: "Al g30: sistema dopaminico quasi ricalibrato." },
  { maxH: 2160, now: "Ciglia bronchiali in rigenerazione: polmoni che si autopuliscono.", next: "Ogni settimana: rischio cardiovascolare giù, capacità aerobica su." },
  { maxH: Infinity, now: "Oltre i 90 giorni: la funzione polmonare continua a salire, il craving chimico è storia.", next: "Ogni mese: rischio cardiovascolare sempre più giù, VO2max su — soprattutto per un asmatico." },
];

export const smokeBenefit = (h: number) =>
  SMOKE_TIMELINE.find((t) => h <= t.maxH) ?? SMOKE_TIMELINE[SMOKE_TIMELINE.length - 1];

const BENEFITS: Record<string, Benefit> = {
  alcoholZero: { icon: "🚫🍺", title: "Zero alcol oggi", now: "Il fegato stanotte ripulisce e basta: VFC su, sonno profondo pieno, niente batticuore alle 4.", next: "Anche domani: cortisolo giù, testosterone su, muro anti-craving alto." },
  training: { icon: "🏋️", title: "Allenamento fatto", now: "Dopamina ed endorfine naturali: umore su, craving giù. Sintesi proteica attiva 24-48h.", next: "Se continui: metabolismo acceso, ricomposizione grasso→muscolo avviata." },
  coldShower: { icon: "🚿", title: "Doccia fredda", now: "Noradrenalina e dopamina in scarica (+250% per ore): lucidità e umore su.", next: "Ripetuta: il sistema nervoso impara a reggere lo stress — utile contro ansia e craving." },
  walk: { icon: "🚶", title: "Camminata 30'+", now: "Cortisolo in calo, circolazione attiva, ritmo sonno-veglia regolato.", next: "Ogni giorno: centinaia di kcal a settimana e ansia sotto soglia." },
  breath: { icon: "🌬", title: "Respirazione 4-8", now: "Parasimpatico attivo: battito giù in 2-3 minuti. Il tuo freno a mano.", next: "Ogni giorno: la risposta calmante diventa automatica, anche in autostrada." },
  water: { icon: "💧", title: "Acqua 2L+", now: "Idratazione piena: più energia, i reni smaltiscono meglio.", next: "Anche domani: pelle, digestione e concentrazione visibilmente meglio." },
  reading: { icon: "📖", title: "Lettura 15'+", now: "Focus profondo: cortisolo giù fino al 68% in 6 minuti.", next: "Ogni giorno: attenzione più lunga — l'antidoto alla testa annebbiata." },
  cleanFood: { icon: "🥗", title: "Alimentazione pulita", now: "Glicemia stabile: niente crolli, meno fame nervosa, più lucidità.", next: "Anche domani: modalità ricomposizione — brucia grasso, protegge muscolo." },
  sleep: { icon: "😴", title: "Sonno 7h+", now: "La ricalibrazione dopaminica avviene dormendo: ogni notte piena accorcia l'astinenza.", next: "Anche domani: GH e testosterone al massimo — il doping naturale è il cuscino." },
};

export function activeBenefits(e: Entry, hours: number): Benefit[] {
  const list: Benefit[] = [];
  if (e.noSmoke) {
    const t = smokeBenefit(hours);
    list.push({
      icon: "🚭",
      title: `Senza fumo — ${Math.floor(hours / 24)}g ${Math.floor(hours % 24)}h`,
      now: t.now,
      next: t.next,
      hero: true,
    });
  }
  if (Number(e.alcohol) === 0) list.push(BENEFITS.alcoholZero);
  if (e.training.done) list.push(BENEFITS.training);
  if (Number(e.foodQuality) >= 4) list.push(BENEFITS.cleanFood);
  if (Number(e.whoop.sleepH) >= 7) list.push(BENEFITS.sleep);
  for (const h of HABITS) if (e.habits[h.id]) list.push(BENEFITS[h.id]);
  return list;
}
