import { dayScore } from "./score";
import { SECTIONS, type Entry, type Goal, type SectionId, type Settings } from "./types";

/**
 * Profilo completo di Francesco ("CHI SONO" + intake): ogni coach AI conosce TUTTO.
 * Vive solo lato server, dentro /api/coach.
 */
export function profileBlock(settings: Settings, hoursNoSmoke: number): string {
  const days = Math.floor(hoursNoSmoke / 24);
  return `PROFILO — Francesco, 25 anni a settembre 2026, 173 cm, ~73 kg attuali (~20% grasso corporeo stimato). Miglior forma storica: 77 kg all'11% — obiettivo di lungo periodo: ricomposizione verso quel riferimento.

FUMO: ha smesso il 10/08/2026 alle 20:00 — senza fumo da ${days} giorni (${Math.floor(hoursNoSmoke)} ore). Prima: IQOS per 6 anni + svapo per 4. Tentativo precedente fallito al giorno 18, trigger n.1: alcol. Trigger noti: birra fuori con gli amici, lavoro intenso al PC.

SALUTE: asma allergica (allergico a pollini/inalanti, NON ad alimenti o integratori). Terapia: 1 puff di Revinty ogni mattina. Fiato limitato nel cardio → progressione cardio graduale. Infortuni: sublussazioni spalla sinistra (priorità lavoro cuffia dei rotatori, manubri prima del bilanciere, cautela su panca piana e overhead press), frattura scomposta omero+radio/polso destro 10 anni fa, gomito destro rotto da bambino.

ALLENAMENTO: fermo dalla palestra da marzo 2026; prima 1-2 anni di pesi, storico 3-4x/settimana strength & conditioning (forza, esplosività, cardio). Carichi di riferimento pre-stop: panca ~85 kg, stacco ~100 kg, leg press ~340 kg, shoulder press 40 kg. Rientro in palestra: 24 agosto 2026, palestra completa. Settimana 1 = 50-60% dei vecchi carichi, RPE basso.

STILE DI VITA: orari di lavoro super flessibili. Sonno tipico 1:00-9:00 (weekend 2-3 → 10-11: correggere il social jet lag, target consistenza ±30 min). Cucina lui, tempo disponibile. 3 caffè/die di cui un doppio a pranzo (regola: ultimo caffè entro le 16). Nessun cibo escluso. Integratori già posseduti (Tsunami Nutrition): creatina monoidrato, proteine isolate, multivitaminico, magnesio, omega-3 certificati.

ALCOL E MENTE: alcol tipico birre col solito giro o gin tonic in centro — obiettivo ridurlo. Ansia prevalentemente fisica, quasi solo alla guida in autostrada (in miglioramento), raramente altrove. Usa Whoop per i biometrici.

FINANZE: netto ~€${settings.netSalary}/mese, saldo conto €${settings.balance}, rata TMAX €${settings.tmaxRate}/mese fino al 2029, PAC €${settings.investPlan}/mese su ETF (${settings.etfs}), TFR maturato ~€${settings.tfr} (non liquido). Fondo emergenza target: 3 mesi ≈ €5.300.

COSA LO MUOVE: la sensazione di "essere a posto" — task completate, niente schifezze/hangover/fumo, soldi gestiti bene. Risponde alla disciplina e ai dati più che alla motivazione: dagli ogni sera la prova misurabile di essere a posto. Obiettivi: zero fumo, ridurre alcol, -grasso +muscolo, meno ansia, sonno migliore.`;
}

/** Diario recente compattato per il contesto AI. */
export function diaryContext(entries: Record<string, Entry>, days = 14): string {
  const keys = Object.keys(entries).sort().slice(-days);
  if (!keys.length) return "Nessun giorno registrato finora.";
  const rows = keys.map((k) => {
    const e = entries[k];
    const s = dayScore(e).score;
    const habits = Object.entries(e.habits).filter(([, v]) => v).map(([h]) => h).join(",") || "-";
    return `${k} score ${s} | fumo:${e.noSmoke ? "no" : "SÌ"} craving:${e.cravings} alcol:${e.alcohol} | allenato:${e.training.done ? e.training.type || "sì" : "no"} | cibo ${e.foodQuality}/5 ${e.meals ? `(${e.meals.slice(0, 120)})` : ""} | whoop rec:${e.whoop.recovery || "-"}% sonno:${e.whoop.sleepH || "-"}h fcr:${e.whoop.fcr || "-"} vfc:${e.whoop.vfc || "-"} spo2:${e.whoop.spo2 || "-"} | umore ${e.mood}/5 ansia ${e.anxiety}/5 | abitudini:${habits}${e.notes ? ` | note: ${e.notes.slice(0, 150)}` : ""}`;
  });
  return rows.join("\n");
}

export function goalContext(goal: Goal | null, sectionId?: SectionId): string {
  if (!goal) return "Nessun obiettivo attivo al momento.";
  const base = `OBIETTIVO ATTIVO: "${goal.title}" entro ${goal.deadline}. Strategia: ${goal.roadmap.summary}`;
  if (sectionId) {
    const sec = goal.roadmap.sections?.[sectionId];
    return `${base}\nRoadmap sezione: ${JSON.stringify(sec ?? {})}`;
  }
  return `${base}\nRoadmap completa: ${JSON.stringify(goal.roadmap.sections ?? {})}`;
}

export const SPECIALIST_ROLES: Record<SectionId, string> = {
  nutrizione:
    "Sei il suo nutrizionista. Valuta i pasti registrati negli ultimi giorni, poi dai il piano per DOMANI: colazione/pranzo/cena/snack con porzioni indicative in grammi, target proteine giornaliero in g (ricomposizione: -grasso +muscolo), e cosa evitare. Sfrutta gli integratori che ha già (creatina, whey isolate, multivitaminico, magnesio, omega-3) indicando dosi e timing. Ricorda: cucina lui e ha tempo, nessun cibo escluso, niente allergie alimentari.",
  training:
    "Sei il suo personal trainer. Proponi la seduta ESATTA per domani: esercizi con serie x reps e RPE basso — riparte dopo 5 mesi fermo, è asmatico (cardio graduale), settimana 1 al 50-60% dei vecchi carichi (riferimenti: panca ~85kg, stacco ~100kg, leg press ~340kg, shoulder press 40kg). PRIORITÀ: lavoro cuffia dei rotatori per la spalla sinistra (sublussazioni), manubri prima del bilanciere, cautela su panca e overhead press. Chiudi con la progressione settimanale. Se domani è prima del 24 agosto (rientro in palestra), proponi lavoro a casa/camminata/mobilità.",
  mente:
    "Sei il suo mental coach. Valuta umore, ansia e craving registrati, poi dai 2-3 pratiche concrete per domani e una strategia specifica per la prossima serata a rischio alcol (birre col giro o gin tonic in centro — l'alcol è il trigger n.1 delle ricadute col fumo). Se emerge ansia da guida in autostrada, includi una tecnica pratica. Chiudi SEMPRE con una riga: non sei uno psicologo, per sintomi persistenti serve un professionista.",
  finanze:
    "Sei il suo consulente finanziario educativo. Valuta il budget (netto, fissi, PAC ETF, saldo), lo stato del fondo emergenza (target 3 mesi ≈ €5.300) e dai 2-3 mosse concrete e numeriche per il prossimo mese. Apri o chiudi SEMPRE con una riga: contenuto educativo, non consulenza finanziaria personalizzata regolamentata.",
};

export function specialistPrompt(
  sectionId: SectionId,
  settings: Settings,
  hours: number,
  entries: Record<string, Entry>,
  goal: Goal | null
): string {
  const sec = SECTIONS.find((s) => s.id === sectionId)!;
  const net = Number(settings.netSalary) || 0;
  const fixed = Number(settings.tmaxRate) || 0;
  const invest = Number(settings.investPlan) || 0;
  return `${profileBlock(settings, hours)}

${goalContext(goal, sectionId)}

DIARIO ULTIMI GIORNI:
${diaryContext(entries)}

FINANZE CORRENTI: netto €${net}, fissi €${fixed}, PAC €${invest}, saldo €${settings.balance}, liberi/mese €${net - fixed - invest}.

${SPECIALIST_ROLES[sectionId]}

Rispondi in italiano come ${sec.label}, max 280 parole, testo semplice senza markdown, diretto e con numeri concreti.`;
}

export function intakePrompt(settings: Settings, hours: number, title: string, deadline: string, today: string): string {
  return `${profileBlock(settings, hours)}

Francesco ha appena dichiarato questo obiettivo: "${title}" con scadenza ${deadline} (oggi è ${today}).
Sei il suo team di coach (nutrizionista, personal trainer, mental coach, consulente finanziario). Genera le domande di intake necessarie per costruire una roadmap precisa e realistica — chiedi solo ciò che NON è già nel profilo qui sopra.
Rispondi SOLO con un array JSON di 6-9 stringhe (le domande, in italiano, brevi e concrete). Nessun testo fuori dal JSON.`;
}

export function roadmapPrompt(
  settings: Settings,
  hours: number,
  title: string,
  deadline: string,
  today: string,
  qa: { q: string; a: string }[]
): string {
  const qaTxt = qa.map(({ q, a }) => `D: ${q}\nR: ${a || "(non risposto)"}`).join("\n");
  return `${profileBlock(settings, hours)}

OBIETTIVO: "${title}" entro ${deadline} (oggi ${today}).
INTAKE:
${qaTxt}

Crea la roadmap operativa. Rispondi SOLO con JSON valido, nessun testo fuori, in questo schema esatto:
{"summary":"2-3 frasi di strategia complessiva onesta e realistica",
"sections":{
"nutrizione":{"daily":["max 4 azioni giornaliere concrete"],"weekly":["max 3 target settimanali misurabili"]},
"training":{"daily":["max 3"],"weekly":["max 3"]},
"mente":{"daily":["max 3"],"weekly":["max 2"]},
"finanze":{"daily":["max 2"],"weekly":["max 2"]}},
"milestones":[{"label":"Settimana 1","detail":"focus della settimana"}]}

Regole: una milestone per settimana fino alla scadenza (max 10). Le azioni devono essere brevi (max 10 parole), realistiche per un asmatico fermo da 5 mesi in astinenza da nicotina (rientro in palestra il 24 agosto, spalla sinistra delicata), e coerenti tra sezioni. Se l'obiettivo è irrealistico nei tempi, DILLO nella summary e proponi il target raggiungibile.`;
}

export const WHOOP_VISION_PROMPT = `Questi sono screenshot dell'app Whoop di oggi. Estrai i valori visibili e rispondi SOLO con JSON valido, nessun testo fuori: {"recovery": numero o null, "sleepH": ore di sonno in decimale o null, "fcr": numero bpm o null, "vfc": numero ms o null, "spo2": numero o null}. Converti il sonno da h:mm a decimale (es. 6:24 → 6.4). Recovery = percentuale RECUPERO, FCR = frequenza cardiaca a riposo, VFC = variabilità della frequenza cardiaca (HRV).`;
