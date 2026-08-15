import React, { useState, useEffect, useRef } from "react";

/* ============================================================
   SVOLTA v3 — il quartier generale di Francesco
   Home (missione del giorno) · Oggi (log) · Obiettivo (wizard AI
   → roadmap) · Sezioni (Nutrizionista / Trainer / Mente / Finanze)
   · Altro (progressi settimana+mese, benefici, export, settings)
   ============================================================ */

const QUIT_DEFAULT = "2026-08-10T20:00";

const C = {
  bg: "#101318", card: "#191E26", cardSoft: "#20262F", line: "#2B333E",
  ink: "#F2F5F8", dim: "#93A0AE",
  blue: "#4A9DFF", green: "#16EC9A", yellow: "#FFD60A", red: "#FF5C5C",
  violet: "#B58CFF", cyan: "#3ED6E0", orange: "#FF9F45",
};

const SECTIONS = [
  { id: "nutrizione", label: "Nutrizionista", icon: "🥗", color: C.green },
  { id: "training", label: "Trainer", icon: "🏋️", color: C.blue },
  { id: "mente", label: "Mente", icon: "🧠", color: C.violet },
  { id: "finanze", label: "Finanze", icon: "💶", color: C.yellow },
];

const HABITS = [
  { id: "coldShower", label: "Doccia fredda", icon: "🚿" },
  { id: "walk", label: "Camminata 30'+", icon: "🚶" },
  { id: "breath", label: "Respirazione 4-8", icon: "🌬" },
  { id: "water", label: "Acqua 2L+", icon: "💧" },
  { id: "reading", label: "Lettura 15'+", icon: "📖" },
];

const emptyEntry = (date) => ({
  date, noSmoke: true, cravings: 0, alcohol: 0,
  training: { done: false, type: "", minutes: "" },
  foodQuality: 0, meals: "", habits: {}, goalTasks: {},
  whoop: { recovery: "", sleepH: "", fcr: "", vfc: "", spo2: "" },
  mood: 3, anxiety: 3, notes: "",
});

const DEFAULT_FINANCE = {
  netSalary: "2028", balance: "1800", investPlan: "250",
  fixed: [{ name: "Rata TMAX (fino 2029)", amount: "250" }],
  tfr: "6718", // fondo 5.517 al 31/12 + ~1.200 quota anno in maturazione
  etfs: "S&P 500 · MSCI World · MSCI EM",
};

function dayScore(e) {
  let s = 0; const parts = [];
  if (e.noSmoke) { s += 30; parts.push(["Niente fumo", 30, 30]); } else parts.push(["Niente fumo", 0, 30]);
  const al = Number(e.alcohol) || 0;
  const alPts = al === 0 ? 20 : al <= 2 ? 10 : 0; s += alPts; parts.push(["Alcol", alPts, 20]);
  const mv = e.training.done ? 20 : e.habits.walk ? 12 : 0; s += mv; parts.push(["Movimento", mv, 20]);
  const nu = (Number(e.foodQuality) || 0) * 3; s += nu; parts.push(["Nutrizione", nu, 15]);
  const sl = Number(e.whoop.sleepH) || 0;
  const slPts = sl >= 7.5 ? 10 : sl >= 7 ? 8 : sl >= 6 ? 4 : 0; s += slPts; parts.push(["Sonno", slPts, 10]);
  const mind = ["coldShower", "breath", "reading"].filter((h) => e.habits[h]).length;
  const mPts = Math.min(5, mind * 2); s += mPts; parts.push(["Mente", mPts, 5]);
  return { score: Math.min(100, s), parts };
}

const todayKey = (d = new Date()) => {
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
const fmtDate = (k) => `${k.slice(8)}/${k.slice(5, 7)}`;

function periodAvg(entries, days) {
  const keys = Object.keys(entries).sort().slice(-days);
  if (!keys.length) return 0;
  return Math.round(keys.reduce((a, k) => a + dayScore(entries[k]).score, 0) / keys.length);
}

/* ---------- benefici ---------- */
const SMOKE_TIMELINE = [
  { maxH: 24, now: "Nicotina in smaltimento rapido, ossigeno a pieno regime.", next: "Domani: nicotina ematica a zero, battito stabilmente più basso." },
  { maxH: 72, now: "Nicotina a zero. Gusto e olfatto in rigenerazione, battito ~20% più basso.", next: "I bronchi iniziano a rilassarsi: respiro più libero." },
  { maxH: 168, now: "Cotinina azzerata: il craving è solo abitudine, non chimica.", next: "Se continui: la nebbia mentale si dirada, l'energia risale." },
  { maxH: 336, now: "Recettori nicotinici in spegnimento, dopamina naturale in ripresa.", next: "Verso il g14: craving rari e deboli, sonno più profondo." },
  { maxH: 720, now: "Circolazione in netto miglioramento, funzione polmonare in salita.", next: "Al g30: sistema dopaminico quasi ricalibrato." },
  { maxH: 99999, now: "Ciglia bronchiali in rigenerazione: polmoni che si autopuliscono.", next: "Ogni settimana: rischio cardiovascolare giù, capacità aerobica su." },
];
const smokeBenefit = (h) => SMOKE_TIMELINE.find((t) => h <= t.maxH) || SMOKE_TIMELINE.at(-1);

const BENEFITS = {
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

function activeBenefits(e, hours) {
  const list = [];
  if (e.noSmoke) { const t = smokeBenefit(hours); list.push({ icon: "🚭", title: `Senza fumo — ${Math.floor(hours / 24)}g ${Math.floor(hours % 24)}h`, now: t.now, next: t.next, hero: true }); }
  if (Number(e.alcohol) === 0) list.push(BENEFITS.alcoholZero);
  if (e.training.done) list.push(BENEFITS.training);
  if (Number(e.foodQuality) >= 4) list.push(BENEFITS.cleanFood);
  if (Number(e.whoop.sleepH) >= 7) list.push(BENEFITS.sleep);
  for (const h of HABITS) if (e.habits[h.id]) list.push(BENEFITS[h.id]);
  return list;
}

/* ---------- AI helpers ---------- */

async function callClaude(content, retries = 2) {
  const blocks = typeof content === "string" ? [{ type: "text", text: content }] : content;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: blocks }] }),
    });
    let data = null;
    try { data = await res.json(); } catch (e) { throw new Error(`HTTP ${res.status}`); }
    if (data && data.error) throw new Error(data.error.message || data.error.type || "Errore API");
    const txt = ((data && data.content) || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!txt) throw new Error("Risposta vuota dall'AI");
    return txt;
  } catch (e) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 900));
      return callClaude(content, retries - 1);
    }
    throw e;
  }
}
const fileToB64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(",")[1]);
  r.onerror = () => reject(new Error("Lettura file fallita"));
  r.readAsDataURL(file);
});
const cleanJSON = (t) => { try { return JSON.parse(t.replace(/```json|```/g, "").trim()); } catch (e) { return null; } };

function profileBlock(state, hours) {
  return `PROFILO: Francesco, 25 anni a settembre 2026, asmatico e allergico. Senza fumo da ${Math.floor(hours)} ore (IQOS 6 anni + svapo 4; tentativo precedente fallito al giorno 18, trigger n.1 alcol). Fermo dalla palestra da marzo (prima 1-2 anni di pesi e S&C). Vuole: zero fumo, meno alcol, -grasso +muscolo, meno ansia (soffre di ansia fisica, episodi di derealizzazione in passato), sonno migliore. FINANZE: netto ~€${state.finance.netSalary}/mese (operaio C1, azienda NCC), saldo conto €${state.finance.balance}, rata TMAX €250/mese per ~3 anni, vuole investire €${state.finance.investPlan}/mese in ETF (${state.finance.etfs}), TFR maturato ~€${state.finance.tfr}.`;
}

/* ---------- Markdown export ---------- */
function buildMarkdown(state) {
  const keys = Object.keys(state.entries).sort();
  let md = `# Diario Svolta — Francesco\n\nExport: ${new Date().toLocaleString("it-IT")}\nStop fumo: ${new Date(state.quitAt).toLocaleString("it-IT")}\n\n`;
  if (state.goal) {
    md += `## Obiettivo attivo: ${state.goal.title} (entro ${state.goal.deadline})\n${state.goal.roadmap?.summary || ""}\n\n`;
  }
  for (const k of keys) {
    const e = state.entries[k]; const s = dayScore(e);
    md += `## ${k} — Score ${s.score}%\n`;
    md += `- Fumo: ${e.noSmoke ? "pulito" : "RICADUTA"} | Craving: ${e.cravings} | Alcol: ${e.alcohol}\n`;
    md += `- Whoop: rec ${e.whoop.recovery || "–"}% | sonno ${e.whoop.sleepH || "–"}h | FCR ${e.whoop.fcr || "–"} | VFC ${e.whoop.vfc || "–"} | SpO2 ${e.whoop.spo2 || "–"}\n`;
    md += `- Allenamento: ${e.training.done ? (e.training.type || "sì") : "riposo"} | Cibo ${e.foodQuality}/5: ${e.meals || "–"}\n`;
    md += `- Abitudini: ${HABITS.filter((h) => e.habits[h.id]).map((h) => h.label).join(", ") || "–"} | Umore ${e.mood}/5 | Ansia ${e.anxiety}/5\n`;
    const done = Object.values(e.goalTasks || {}).filter(Boolean).length;
    if (state.goal) md += `- Missione obiettivo: ${done} task completati\n`;
    if (e.notes) md += `- Note: ${e.notes}\n`;
    md += `\n`;
  }
  return md;
}

/* ---------- UI atoms ---------- */

function Ring({ pct, size = 108, stroke = 10, color, label }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(100, pct) / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke={C.line} strokeWidth={stroke} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .8s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <div style={{ fontSize: size * 0.26, fontWeight: 800, color: C.ink }}>{pct}<span style={{ fontSize: size * 0.13, color: C.dim }}>%</span></div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.card, borderRadius: 18, padding: 16, border: `1px solid ${C.line}`, ...style }}>{children}</div>
);
const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "4px 2px" }}>{children}</div>
);

function BigToggle({ on, onLabel, offLabel, onColor, offColor, onChange, icon }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      flex: 1, padding: "16px 8px", borderRadius: 16, border: "none", cursor: "pointer",
      background: on ? `${onColor}22` : `${offColor}18`, boxShadow: `inset 0 0 0 1.5px ${on ? onColor : offColor}`,
      color: on ? onColor : offColor, fontWeight: 800, fontSize: 15,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    }}><span style={{ fontSize: 22 }}>{icon}</span>{on ? onLabel : offLabel}</button>
  );
}
function Chip({ on, onChange, icon, label, color = C.cyan }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      padding: "10px 14px", borderRadius: 999, cursor: "pointer", border: "none",
      background: on ? `${color}22` : C.cardSoft, boxShadow: `inset 0 0 0 1.5px ${on ? color : C.line}`,
      color: on ? color : C.dim, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6,
    }}><span>{icon}</span>{label}{on ? " ✓" : ""}</button>
  );
}
function MiniInput({ label, value, onChange, suffix, prefix }) {
  return (
    <div style={{ flex: "1 1 30%", minWidth: 92 }}>
      <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", background: C.cardSoft, borderRadius: 12, border: `1px solid ${C.line}`, padding: "0 10px" }}>
        {prefix && <span style={{ color: C.dim, fontSize: 13, fontWeight: 700 }}>{prefix}</span>}
        <input value={value} inputMode="decimal" onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: C.ink, fontSize: 17, fontWeight: 700, padding: "10px 4px" }} />
        {suffix && <span style={{ color: C.dim, fontSize: 12, fontWeight: 700 }}>{suffix}</span>}
      </div>
    </div>
  );
}
function Stepper({ label, value, onChange, color = C.ink }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <button onClick={() => onChange(Math.max(0, Number(value) - 1))} style={stepBtn}>−</button>
        <span style={{ fontSize: 26, fontWeight: 800, color, minWidth: 30 }}>{value}</span>
        <button onClick={() => onChange(Number(value) + 1)} style={stepBtn}>+</button>
      </div>
    </div>
  );
}
const stepBtn = { width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.line}`, background: C.cardSoft, color: C.ink, fontSize: 20, cursor: "pointer", fontWeight: 700 };
function ScoreBar({ name, val, max, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: C.ink, fontWeight: 600 }}>{name}</span>
        <span style={{ color: C.dim, fontWeight: 700 }}>{typeof val === "number" && typeof max === "number" ? `${val}/${max}` : val}</span>
      </div>
      <div style={{ height: 7, background: C.line, borderRadius: 4 }}>
        <div style={{ width: `${Math.min(100, (val / max) * 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width .5s" }} />
      </div>
    </div>
  );
}
const TextArea = (p) => (
  <textarea {...p} style={{ width: "100%", background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, color: C.ink, fontSize: 15, resize: "vertical", fontFamily: "inherit", ...p.style }} />
);
const Btn = ({ children, onClick, disabled, color = C.blue, outline }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: "100%", padding: "15px 0", borderRadius: 14, cursor: disabled ? "default" : "pointer",
    border: outline ? `1.5px solid ${color}` : "none",
    background: disabled ? C.line : outline ? "transparent" : color,
    color: outline ? color : "#0C1220", fontWeight: 800, fontSize: 15,
  }}>{children}</button>
);

/* ================= APP ================= */

export default function App() {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("home");
  const [secTab, setSecTab] = useState("nutrizione");
  const [saved, setSaved] = useState("");
  const [specialistText, setSpecialistText] = useState({});
  const [specialistBusy, setSpecialistBusy] = useState("");
  const [wiz, setWiz] = useState({ stage: "idle", title: "", deadline: "", questions: [], answers: {}, err: "" });
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrMsg, setOcrMsg] = useState("");
  const fileRef = useRef(null);
  const t = useRef(null);
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(id); }, []);

  useEffect(() => {
    (async () => {
      let loaded = null;
      try { const r = await window.storage.get("svolta-v3"); if (r && r.value) loaded = JSON.parse(r.value); } catch (e) { }
      if (!loaded) {
        // migra dalla v2 se esiste
        try { const r2 = await window.storage.get("svolta-v1"); if (r2 && r2.value) { const old = JSON.parse(r2.value); loaded = { quitAt: old.quitAt, entries: old.entries || {} }; } } catch (e) { }
      }
      const base = loaded || { quitAt: QUIT_DEFAULT, entries: {} };
      if (base.quitAt === "2026-08-11T20:00") base.quitAt = QUIT_DEFAULT;
      if (!base.finance) base.finance = DEFAULT_FINANCE;
      if (!("goal" in base)) base.goal = null;
      const tk = todayKey();
      if (!base.entries[tk]) base.entries[tk] = emptyEntry(tk);
      if (!base.entries[tk].goalTasks) base.entries[tk].goalTasks = {};
      setState(base);
    })();
  }, []);

  const persist = (next) => {
    setState(next);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(async () => {
      try { await window.storage.set("svolta-v3", JSON.stringify(next)); setSaved("✓ salvato"); setTimeout(() => setSaved(""), 1400); }
      catch (e) { setSaved("errore"); }
    }, 500);
  };

  if (!state) return <div style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", color: C.dim, fontFamily: "Inter, sans-serif" }}>Caricamento…</div>;

  const tk = todayKey();
  const entry = state.entries[tk] || emptyEntry(tk);
  const setE = (patch) => persist({ ...state, entries: { ...state.entries, [tk]: { ...entry, ...patch } } });
  const setFin = (patch) => persist({ ...state, finance: { ...state.finance, ...patch } });

  const hours = Math.max(0, (Date.now() - new Date(state.quitAt).getTime()) / 36e5);
  const dayS = dayScore(entry);
  const weekS = periodAvg(state.entries, 7);
  const monthS = periodAvg(state.entries, 30);
  const ringColor = (p) => (p >= 70 ? C.green : p >= 40 ? C.yellow : C.red);
  const benefits = activeBenefits(entry, hours);
  const allKeys = Object.keys(state.entries).sort();

  /* ----- goal tasks di oggi ----- */
  const goalTasks = [];
  if (state.goal?.roadmap?.sections) {
    for (const s of SECTIONS) {
      const daily = state.goal.roadmap.sections[s.id]?.daily || [];
      daily.forEach((task, i) => goalTasks.push({ id: `${s.id}-${i}`, section: s, task }));
    }
  }
  const tasksDone = goalTasks.filter((gt) => entry.goalTasks?.[gt.id]).length;
  const missionPct = goalTasks.length ? Math.round((tasksDone / goalTasks.length) * 100) : 0;
  const toggleTask = (id) => setE({ goalTasks: { ...entry.goalTasks, [id]: !entry.goalTasks?.[id] } });

  const daysToDeadline = state.goal?.deadline ? Math.max(0, Math.ceil((new Date(state.goal.deadline) - new Date()) / 864e5)) : null;

  /* ----- finanze derivate ----- */
  const net = Number(state.finance.netSalary) || 0;
  const fixedTot = (state.finance.fixed || []).reduce((a, f) => a + (Number(f.amount) || 0), 0);
  const invest = Number(state.finance.investPlan) || 0;
  const free = net - fixedTot - invest;
  const investPct = net ? Math.round((invest / net) * 100) : 0;

  /* ----- wizard ----- */
  const genQuestions = async () => {
    if (!wiz.title.trim() || !wiz.deadline) { setWiz({ ...wiz, err: "Scrivi obiettivo e scadenza" }); return; }
    setWiz({ ...wiz, stage: "loadingQ", err: "" });
    try {
      const txt = await callClaude(`${profileBlock(state, hours)}
Francesco ha appena dichiarato questo obiettivo: "${wiz.title}" con scadenza ${wiz.deadline} (oggi è ${tk}).
Sei il suo team di coach (nutrizionista, personal trainer, mental coach, consulente). Genera le domande di intake necessarie per costruire una roadmap precisa e realistica. Rispondi SOLO con un array JSON di 6-9 stringhe (le domande, in italiano, brevi e concrete, es. peso attuale, esperienza, vincoli orari, budget, ecc). Nessun testo fuori dal JSON.`);
      const qs = cleanJSON(txt);
      if (Array.isArray(qs) && qs.length) setWiz({ ...wiz, stage: "questions", questions: qs, answers: {}, err: "" });
      else setWiz({ ...wiz, stage: "input", err: "Risposta non valida, riprova" });
    } catch (e) { setWiz({ ...wiz, stage: "input", err: `Errore: ${e.message}` }); }
  };

  const buildRoadmap = async () => {
    setWiz({ ...wiz, stage: "building", err: "" });
    const qa = wiz.questions.map((q, i) => `D: ${q}\nR: ${wiz.answers[i] || "(non risposto)"}`).join("\n");
    try {
      const txt = await callClaude(`${profileBlock(state, hours)}
OBIETTIVO: "${wiz.title}" entro ${wiz.deadline} (oggi ${tk}).
INTAKE:\n${qa}
Crea la roadmap operativa. Rispondi SOLO con JSON valido, nessun testo fuori, in questo schema esatto:
{"summary":"2-3 frasi di strategia complessiva onesta e realistica",
"sections":{
"nutrizione":{"daily":["max 4 azioni giornaliere concrete"],"weekly":["max 3 target settimanali misurabili"]},
"training":{"daily":["max 3"],"weekly":["max 3"]},
"mente":{"daily":["max 3"],"weekly":["max 2"]},
"finanze":{"daily":["max 2"],"weekly":["max 2"]}},
"milestones":[{"label":"Settimana 1","detail":"focus"},... una per settimana fino alla scadenza, max 10]}
Le azioni devono essere brevi (max 10 parole), realistiche per un asmatico fermo da 5 mesi in astinenza da nicotina, e coerenti tra sezioni. Se l'obiettivo è irrealistico nei tempi, dillo nella summary e proponi il target raggiungibile.`);
      const rm = cleanJSON(txt);
      if (rm && rm.sections) {
        persist({ ...state, goal: { title: wiz.title, deadline: wiz.deadline, roadmap: rm, createdAt: tk } });
        setWiz({ stage: "idle", title: "", deadline: "", questions: [], answers: {}, err: "" });
        setTab("home");
      } else setWiz({ ...wiz, stage: "questions", err: "Roadmap non valida, riprova" });
    } catch (e) { setWiz({ ...wiz, stage: "questions", err: `Errore: ${e.message}` }); }
  };

  /* ----- specialisti AI ----- */
  const askSpecialist = async (secId) => {
    setSpecialistBusy(secId);
    const sec = SECTIONS.find((s) => s.id === secId);
    const recent = allKeys.slice(-10).map((k) => ({ data: k, score: dayScore(state.entries[k]).score, ...state.entries[k] }));
    const goalCtx = state.goal ? `OBIETTIVO ATTIVO: "${state.goal.title}" entro ${state.goal.deadline}. Roadmap sezione: ${JSON.stringify(state.goal.roadmap?.sections?.[secId] || {})}` : "Nessun obiettivo attivo.";
    const roles = {
      nutrizione: "Sei il suo nutrizionista: valuta i pasti registrati, dai il piano per domani (colazione/pranzo/cena/snack con porzioni indicative), proteine target, e cosa evitare. Considera che vuole -grasso +muscolo.",
      training: "Sei il suo personal trainer: proponi l'allenamento esatto per domani (esercizi, serie x reps, RPE basso — riparte da 5 mesi fermo, asmatico, settimana 1 = 50-60% dei vecchi carichi), progressione settimanale.",
      mente: "Sei il suo mental coach: valuta umore/ansia/craving registrati, dai 2-3 pratiche concrete per domani e una strategia per il prossimo momento a rischio (serate alcol). Non sei uno psicologo clinico: per sintomi persistenti rimanda a un professionista.",
      finanze: "Sei il suo consulente finanziario educativo (non consulenza personalizzata regolamentata, dillo in una riga): valuta il budget (netto, fissi, PAC ETF), fondo emergenza, e dai 2-3 mosse concrete. Nota: ha crypto in forte perdita (XRP -60%, Hedera -79%, ~€240 totali) e ETF core in guadagno.",
    };
    const prompt = `${profileBlock(state, hours)}\n${goalCtx}\nDati ultimi giorni: ${JSON.stringify(recent)}\nFinanze: netto €${net}, fissi €${fixedTot}, PAC €${invest}, saldo €${state.finance.balance}.\n${roles[secId]}\nRispondi in italiano, max 250 parole, testo semplice senza markdown, diretto e con numeri.`;
    try { const txt = await callClaude(prompt); setSpecialistText({ ...specialistText, [secId]: txt || "Nessuna risposta." }); }
    catch (e) { setSpecialistText({ ...specialistText, [secId]: `Errore: ${e.message}` }); }
    setSpecialistBusy("");
  };

  const importShots = async (files) => {
    if (!files || !files.length) return;
    setOcrBusy(true); setOcrMsg("");
    try {
      const content = [];
      for (const f of Array.from(files).slice(0, 4)) {
        content.push({ type: "image", source: { type: "base64", media_type: f.type || "image/png", data: await fileToB64(f) } });
      }
      content.push({
        type: "text",
        text: `Questi sono screenshot dell'app Whoop di oggi. Estrai i valori visibili e rispondi SOLO con JSON valido, nessun testo fuori: {"recovery": numero o null, "sleepH": ore di sonno in decimale o null, "fcr": numero bpm o null, "vfc": numero ms o null, "spo2": numero o null}. Converti il sonno da h:mm a decimale (es. 6:24 → 6.4). Recovery = percentuale RECUPERO, FCR = frequenza cardiaca a riposo, VFC = variabilità.`,
      });
      const txt = await callClaude(content);
      const j = cleanJSON(txt);
      if (j) {
        setE({
          whoop: {
            ...entry.whoop,
            recovery: j.recovery != null ? String(j.recovery) : entry.whoop.recovery,
            sleepH: j.sleepH != null ? String(j.sleepH) : entry.whoop.sleepH,
            fcr: j.fcr != null ? String(j.fcr) : entry.whoop.fcr,
            vfc: j.vfc != null ? String(j.vfc) : entry.whoop.vfc,
            spo2: j.spo2 != null ? String(j.spo2) : entry.whoop.spo2,
          },
        });
        setOcrMsg("✓ Dati Whoop importati");
      } else setOcrMsg("Non sono riuscito a leggere i valori, riprova");
    } catch (e) { setOcrMsg(`Errore: ${e.message}`); }
    setOcrBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadMD = () => {
    const blob = new Blob([buildMarkdown(state)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `svolta-${tk}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ================= RENDER ================= */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: 92 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box} input::placeholder,textarea::placeholder{color:#5A6675}
        button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid ${C.blue};outline-offset:2px}
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "22px 16px 12px", display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "0.14em" }}>SVOLTA</div>
          <div style={{ fontSize: 12, color: C.dim }}>{saved || new Date().toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}</div>
        </div>

        {/* ---------- HOME ---------- */}
        {tab === "home" && (<>
          <Card style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: `linear-gradient(90deg, ${C.card}, #16281F)` }}>
            <div style={{ fontSize: 13, color: C.dim, fontWeight: 700 }}>🚭 SENZA FUMO</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: C.green }}>{Math.floor(hours / 24)}g {Math.floor(hours % 24)}h</div>
          </Card>

          <Card style={{ display: "flex", justifyContent: "space-around", padding: "20px 8px" }}>
            <Ring pct={dayS.score} color={ringColor(dayS.score)} label="Svolta oggi" size={124} />
            {state.goal && <Ring pct={missionPct} color={C.orange} label="Missione oggi" size={124} />}
          </Card>

          {state.goal ? (<>
            <Card style={{ boxShadow: `inset 0 0 0 1.5px ${C.orange}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>🎯 {state.goal.title}</div>
                <div style={{ fontSize: 12, color: C.orange, fontWeight: 800 }}>-{daysToDeadline}g</div>
              </div>
            </Card>
            <SectionTitle>Missione di oggi — {tasksDone}/{goalTasks.length}</SectionTitle>
            {SECTIONS.map((s) => {
              const tasks = goalTasks.filter((gt) => gt.section.id === s.id);
              if (!tasks.length) return null;
              return (
                <Card key={s.id} style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: s.color, marginBottom: 8 }}>{s.icon} {s.label.toUpperCase()}</div>
                  {tasks.map((gt) => {
                    const done = !!entry.goalTasks?.[gt.id];
                    return (
                      <button key={gt.id} onClick={() => toggleTask(gt.id)} style={{
                        width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                        background: "transparent", border: "none", cursor: "pointer", padding: "8px 2px",
                        color: done ? C.dim : C.ink, textDecoration: done ? "line-through" : "none", fontSize: 14, fontWeight: 600,
                      }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center", flexShrink: 0,
                          background: done ? s.color : C.cardSoft, boxShadow: `inset 0 0 0 1.5px ${done ? s.color : C.line}`,
                          color: "#10131A", fontWeight: 800, fontSize: 13,
                        }}>{done ? "✓" : ""}</span>
                        {gt.task}
                      </button>
                    );
                  })}
                </Card>
              );
            })}
          </>) : (
            <Card onClick={() => setTab("obiettivo")} style={{ cursor: "pointer", textAlign: "center", padding: 22, boxShadow: `inset 0 0 0 1.5px ${C.orange}` }}>
              <div style={{ fontSize: 26 }}>🎯</div>
              <div style={{ fontWeight: 800, marginTop: 4 }}>Nessun obiettivo attivo</div>
              <div style={{ fontSize: 13, color: C.dim, marginTop: 2 }}>Creane uno: il team ti farà le domande e costruirà la roadmap</div>
            </Card>
          )}

          {benefits.length > 0 && (<>
            <SectionTitle>Il tuo corpo oggi</SectionTitle>
            {benefits.slice(0, 2).map((b, i) => (
              <Card key={i} style={b.hero ? { boxShadow: `inset 0 0 0 1.5px ${C.green}` } : {}}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><span style={{ fontSize: 20 }}>{b.icon}</span><b style={{ fontSize: 15 }}>{b.title}</b></div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55 }}><span style={{ color: C.green, fontWeight: 800 }}>ORA → </span>{b.now}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 6 }}><span style={{ color: C.blue, fontWeight: 800 }}>SE CONTINUI → </span>{b.next}</div>
              </Card>
            ))}
            {benefits.length > 2 && <div onClick={() => setTab("altro")} style={{ textAlign: "center", color: C.blue, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+{benefits.length - 2} altri benefici →</div>}
          </>)}
        </>)}

        {/* ---------- OGGI (log) ---------- */}
        {tab === "oggi" && (<>
          <SectionTitle>Le due battaglie</SectionTitle>
          <div style={{ display: "flex", gap: 10 }}>
            <BigToggle on={entry.noSmoke} icon="🚭" onLabel="Niente fumo" offLabel="Ho fumato" onColor={C.green} offColor={C.red} onChange={(v) => setE({ noSmoke: v })} />
            <BigToggle on={entry.training.done} icon="🏋️" onLabel="Allenato" offLabel="Riposo" onColor={C.blue} offColor={C.dim} onChange={(v) => setE({ training: { ...entry.training, done: v } })} />
          </div>
          <Card style={{ display: "flex", gap: 8 }}>
            <Stepper label="🍺 Drink oggi" value={entry.alcohol} onChange={(v) => setE({ alcohol: v })} color={Number(entry.alcohol) === 0 ? C.green : Number(entry.alcohol) <= 2 ? C.yellow : C.red} />
            <Stepper label="💪 Craving resistiti" value={entry.cravings} onChange={(v) => setE({ cravings: v })} color={C.cyan} />
          </Card>
          <SectionTitle>Abitudini</SectionTitle>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {HABITS.map((h) => <Chip key={h.id} icon={h.icon} label={h.label} on={!!entry.habits[h.id]} onChange={(v) => setE({ habits: { ...entry.habits, [h.id]: v } })} />)}
          </div>
          <SectionTitle>Whoop</SectionTitle>
          <Card>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={(e) => importShots(e.target.files)} />
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={ocrBusy} style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: `1.5px dashed ${C.cyan}`,
              background: `${C.cyan}12`, color: C.cyan, fontWeight: 800, fontSize: 14,
              cursor: ocrBusy ? "default" : "pointer", marginBottom: 12,
            }}>{ocrBusy ? "📷 Sto leggendo gli screenshot…" : "📷 Carica screenshot Whoop (auto-compila)"}</button>
            {ocrMsg && <div style={{ fontSize: 13, fontWeight: 700, color: ocrMsg.startsWith("✓") ? C.green : C.red, marginBottom: 10 }}>{ocrMsg}</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <MiniInput label="RECUPERO %" value={entry.whoop.recovery} onChange={(v) => setE({ whoop: { ...entry.whoop, recovery: v } })} />
            <MiniInput label="SONNO H" value={entry.whoop.sleepH} onChange={(v) => setE({ whoop: { ...entry.whoop, sleepH: v } })} />
            <MiniInput label="FCR" value={entry.whoop.fcr} onChange={(v) => setE({ whoop: { ...entry.whoop, fcr: v } })} />
            <MiniInput label="VFC" value={entry.whoop.vfc} onChange={(v) => setE({ whoop: { ...entry.whoop, vfc: v } })} />
            <MiniInput label="SPO2 %" value={entry.whoop.spo2} onChange={(v) => setE({ whoop: { ...entry.whoop, spo2: v } })} />
          </div>
          </Card>
          <SectionTitle>Nutrizione</SectionTitle>
          <Card>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 6 }}>QUALITÀ (1 schifo → 5 pulito)</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setE({ foodQuality: n })} style={{
                  flex: 1, height: 40, borderRadius: 12, cursor: "pointer", border: "none",
                  background: n <= entry.foodQuality ? C.green : C.cardSoft,
                  boxShadow: `inset 0 0 0 1.5px ${n <= entry.foodQuality ? C.green : C.line}`,
                  color: n <= entry.foodQuality ? "#0B1512" : C.dim, fontWeight: 800, fontSize: 16,
                }}>{n}</button>
              ))}
            </div>
            <TextArea value={entry.meals} onChange={(e) => setE({ meals: e.target.value })} rows={2} placeholder="Cosa hai mangiato oggi…" />
          </Card>
          <SectionTitle>Testa</SectionTitle>
          <Card>
            {[["Umore", "mood", C.blue], ["Ansia (5 = alta)", "anxiety", C.red]].map(([lbl, key, col]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 6 }}>{lbl.toUpperCase()}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setE({ [key]: n })} style={{
                      flex: 1, height: 36, borderRadius: 10, cursor: "pointer", border: "none",
                      background: n <= entry[key] ? col : C.cardSoft, boxShadow: `inset 0 0 0 1.5px ${n <= entry[key] ? col : C.line}`,
                      color: n <= entry[key] ? "#10131A" : C.dim, fontWeight: 800,
                    }}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
            <TextArea value={entry.notes} onChange={(e) => setE({ notes: e.target.value })} rows={2} placeholder="Note del giorno…" />
          </Card>
          <SectionTitle>Composizione dello score</SectionTitle>
          <Card>{dayS.parts.map(([n, v, m]) => <ScoreBar key={n} name={n} val={v} max={m} color={v / m >= 0.99 ? C.green : v > 0 ? C.yellow : C.line} />)}</Card>
        </>)}

        {/* ---------- OBIETTIVO ---------- */}
        {tab === "obiettivo" && (<>
          {state.goal && wiz.stage === "idle" && (<>
            <Card style={{ boxShadow: `inset 0 0 0 1.5px ${C.orange}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>🎯 {state.goal.title}</div>
                <div style={{ fontSize: 12, color: C.orange, fontWeight: 800 }}>-{daysToDeadline} giorni</div>
              </div>
              <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6, margin: "10px 0 0" }}>{state.goal.roadmap?.summary}</p>
            </Card>
            <SectionTitle>Milestone</SectionTitle>
            {(state.goal.roadmap?.milestones || []).map((m, i) => (
              <Card key={i} style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ minWidth: 34, height: 34, borderRadius: 10, background: `${C.orange}22`, color: C.orange, display: "grid", placeItems: "center", fontWeight: 800 }}>{i + 1}</div>
                <div><b style={{ fontSize: 14 }}>{m.label}</b><div style={{ fontSize: 13, color: C.dim }}>{m.detail}</div></div>
              </Card>
            ))}
            <SectionTitle>Target settimanali per sezione</SectionTitle>
            {SECTIONS.map((s) => {
              const wk = state.goal.roadmap?.sections?.[s.id]?.weekly || [];
              if (!wk.length) return null;
              return (
                <Card key={s.id} style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: s.color, marginBottom: 6 }}>{s.icon} {s.label.toUpperCase()}</div>
                  {wk.map((w, i) => <div key={i} style={{ fontSize: 14, padding: "4px 0", color: C.ink }}>• {w}</div>)}
                </Card>
              );
            })}
            <Btn outline color={C.red} onClick={() => { if (window.confirm("Chiudere questo obiettivo?")) persist({ ...state, goal: null }); }}>Chiudi obiettivo</Btn>
            <Btn outline color={C.orange} onClick={() => setWiz({ ...wiz, stage: "input" })}>Nuovo obiettivo (sostituisce)</Btn>
          </>)}

          {(!state.goal || wiz.stage !== "idle") && (<>
            {(wiz.stage === "idle" || wiz.stage === "input" || wiz.stage === "loadingQ") && (
              <Card>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>🎯 Crea obiettivo</div>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 4 }}>OBIETTIVO (sii specifico: cosa, quanto)</div>
                <TextArea rows={2} value={wiz.title} onChange={(e) => setWiz({ ...wiz, title: e.target.value })}
                  placeholder="es. Viaggio a New York il 15 ottobre: +3kg massa muscolare e ansia sotto controllo" />
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, margin: "12px 0 4px" }}>SCADENZA</div>
                <input type="date" value={wiz.deadline} onChange={(e) => setWiz({ ...wiz, deadline: e.target.value })}
                  style={{ width: "100%", background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, color: C.ink, fontSize: 15, colorScheme: "dark", fontFamily: "inherit" }} />
                {wiz.err && <div style={{ color: C.red, fontSize: 13, marginTop: 8, fontWeight: 700 }}>{wiz.err}</div>}
                <div style={{ marginTop: 14 }}>
                  <Btn color={C.orange} disabled={wiz.stage === "loadingQ"} onClick={genQuestions}>
                    {wiz.stage === "loadingQ" ? "Il team prepara le domande…" : "Avanti → il team ti farà le domande"}
                  </Btn>
                </div>
              </Card>
            )}
            {(wiz.stage === "questions" || wiz.stage === "building") && (
              <Card>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>📋 Intake del team</div>
                <p style={{ fontSize: 13, color: C.dim, margin: "0 0 12px" }}>Più sei preciso, più la roadmap sarà su misura.</p>
                {wiz.questions.map((q, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{i + 1}. {q}</div>
                    <TextArea rows={1} value={wiz.answers[i] || ""} onChange={(e) => setWiz({ ...wiz, answers: { ...wiz.answers, [i]: e.target.value } })} />
                  </div>
                ))}
                {wiz.err && <div style={{ color: C.red, fontSize: 13, marginBottom: 8, fontWeight: 700 }}>{wiz.err}</div>}
                <Btn color={C.orange} disabled={wiz.stage === "building"} onClick={buildRoadmap}>
                  {wiz.stage === "building" ? "Il team costruisce la roadmap…" : "Crea la roadmap"}
                </Btn>
              </Card>
            )}
          </>)}
        </>)}

        {/* ---------- SEZIONI ---------- */}
        {tab === "sezioni" && (<>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setSecTab(s.id)} style={{
                padding: "10px 14px", borderRadius: 999, border: "none", cursor: "pointer", whiteSpace: "nowrap",
                background: secTab === s.id ? `${s.color}22` : C.cardSoft,
                boxShadow: `inset 0 0 0 1.5px ${secTab === s.id ? s.color : C.line}`,
                color: secTab === s.id ? s.color : C.dim, fontWeight: 800, fontSize: 13,
              }}>{s.icon} {s.label}</button>
            ))}
          </div>

          {(() => {
            const s = SECTIONS.find((x) => x.id === secTab);
            const secGoal = state.goal?.roadmap?.sections?.[secTab];
            return (<>
              {/* stato rilevante per sezione */}
              {secTab === "nutrizione" && (
                <Card><ScoreBar name="Qualità cibo oggi" val={entry.foodQuality} max={5} color={C.green} />
                  <div style={{ fontSize: 13, color: C.dim }}>{entry.meals || "Nessun pasto registrato oggi — segnalo nella tab Oggi."}</div></Card>
              )}
              {secTab === "training" && (
                <Card>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <MiniInput label="TIPO SEDUTA" value={entry.training.type} onChange={(v) => setE({ training: { ...entry.training, type: v } })} />
                    <MiniInput label="MINUTI" value={entry.training.minutes} onChange={(v) => setE({ training: { ...entry.training, minutes: v } })} suffix="'" />
                  </div>
                  <div style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>Ultimi 7 giorni: {allKeys.slice(-7).filter((k) => state.entries[k].training.done).length} allenamenti · Recupero oggi: {entry.whoop.recovery || "–"}%</div>
                </Card>
              )}
              {secTab === "mente" && (
                <Card>
                  <ScoreBar name="Umore oggi" val={entry.mood} max={5} color={C.blue} />
                  <ScoreBar name="Ansia oggi (meno è meglio)" val={entry.anxiety} max={5} color={C.red} />
                  <div style={{ fontSize: 13, color: C.dim }}>Craving resistiti oggi: {entry.cravings} · Senza fumo: {Math.floor(hours / 24)}g {Math.floor(hours % 24)}h</div>
                </Card>
              )}
              {secTab === "finanze" && (<>
                <Card>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <MiniInput label="NETTO MESE" prefix="€" value={state.finance.netSalary} onChange={(v) => setFin({ netSalary: v })} />
                    <MiniInput label="SALDO CONTO" prefix="€" value={state.finance.balance} onChange={(v) => setFin({ balance: v })} />
                    <MiniInput label="PAC ETF MESE" prefix="€" value={state.finance.investPlan} onChange={(v) => setFin({ investPlan: v })} />
                    <MiniInput label="RATA TMAX" prefix="€" value={state.finance.fixed[0]?.amount || ""} onChange={(v) => setFin({ fixed: [{ ...state.finance.fixed[0], amount: v }] })} />
                  </div>
                </Card>
                <Card>
                  <ScoreBar name={`PAC ETF (${state.finance.etfs})`} val={invest} max={net || 1} color={C.yellow} />
                  <div style={{ fontSize: 13, color: C.dim, marginBottom: 10 }}>= {investPct}% del netto · dopo rata e PAC restano <b style={{ color: C.ink }}>€{free}</b>/mese per tutto il resto</div>
                  <ScoreBar name="Fondo emergenza (target 3 mesi ≈ €5.300)" val={Number(state.finance.balance) || 0} max={5300} color={(Number(state.finance.balance) || 0) >= 5300 ? C.green : C.orange} />
                  <div style={{ fontSize: 13, color: C.dim }}>TFR maturato in azienda: ~€{state.finance.tfr} (fondo al 31/12 + quota anno) — è tuo ma non liquido.</div>
                </Card>
              </>)}

              {/* task e target della roadmap per questa sezione */}
              {secGoal && (
                <Card style={{ boxShadow: `inset 0 0 0 1.5px ${s.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: s.color, marginBottom: 8 }}>🎯 DALLA ROADMAP</div>
                  {(secGoal.daily || []).map((t2, i) => {
                    const id = `${secTab}-${i}`; const done = !!entry.goalTasks?.[id];
                    return (
                      <button key={id} onClick={() => toggleTask(id)} style={{
                        width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                        background: "transparent", border: "none", cursor: "pointer", padding: "7px 2px",
                        color: done ? C.dim : C.ink, textDecoration: done ? "line-through" : "none", fontSize: 14, fontWeight: 600,
                      }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center", flexShrink: 0, background: done ? s.color : C.cardSoft, boxShadow: `inset 0 0 0 1.5px ${done ? s.color : C.line}`, color: "#10131A", fontWeight: 800, fontSize: 12 }}>{done ? "✓" : ""}</span>
                        {t2}
                      </button>
                    );
                  })}
                  {(secGoal.weekly || []).length > 0 && <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>Settimana: {(secGoal.weekly || []).join(" · ")}</div>}
                </Card>
              )}

              <Btn color={s.color} disabled={specialistBusy === secTab} onClick={() => askSpecialist(secTab)}>
                {specialistBusy === secTab ? "Sto analizzando…" : `Chiedi al ${s.label.toLowerCase()}`}
              </Btn>
              {specialistText[secTab] && (
                <Card style={{ boxShadow: `inset 0 0 0 1.5px ${s.color}` }}>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 14.5, lineHeight: 1.65 }}>{specialistText[secTab]}</div>
                </Card>
              )}
            </>);
          })()}
        </>)}

        {/* ---------- ALTRO ---------- */}
        {tab === "altro" && (<>
          <SectionTitle>Progressi</SectionTitle>
          <Card style={{ display: "flex", justifyContent: "space-around", padding: "20px 8px" }}>
            <Ring pct={weekS} color={C.blue} label="Settimana" size={104} />
            <Ring pct={monthS} color={C.violet} label="Mese" size={104} />
          </Card>
          <Card>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 100 }}>
              {allKeys.slice(-14).map((k) => {
                const s = dayScore(state.entries[k]).score;
                return (
                  <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 10, color: C.dim, fontWeight: 700 }}>{s}</div>
                    <div style={{ width: "100%", height: `${Math.max(4, s * 0.75)}px`, background: ringColor(s), borderRadius: 4 }} />
                    <span style={{ fontSize: 9, color: C.dim }}>{fmtDate(k)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            {(() => {
              const last7 = allKeys.slice(-7).map((k) => state.entries[k]);
              return [
                ["🚭 Giorni puliti", last7.filter((e) => e.noSmoke).length, 7, C.green],
                ["🚫🍺 Giorni zero alcol", last7.filter((e) => Number(e.alcohol) === 0).length, 5, C.cyan],
                ["🏋️ Allenamenti", last7.filter((e) => e.training.done).length, 3, C.blue],
                ["😴 Notti ≥ 7h", last7.filter((e) => Number(e.whoop.sleepH) >= 7).length, 5, C.violet],
                ["🥗 Cibo ≥ 4/5", last7.filter((e) => Number(e.foodQuality) >= 4).length, 4, C.yellow],
              ].map(([n, v, m, col]) => <ScoreBar key={n} name={n} val={v} max={m} color={col} />);
            })()}
          </Card>

          <SectionTitle>Tutti i benefici di oggi</SectionTitle>
          {benefits.length === 0 && <Card><div style={{ color: C.dim }}>Registra le azioni di oggi per sbloccare i benefici.</div></Card>}
          {benefits.map((b, i) => (
            <Card key={i} style={b.hero ? { boxShadow: `inset 0 0 0 1.5px ${C.green}` } : {}}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><span style={{ fontSize: 20 }}>{b.icon}</span><b style={{ fontSize: 15 }}>{b.title}</b></div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55 }}><span style={{ color: C.green, fontWeight: 800 }}>ORA → </span>{b.now}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 6 }}><span style={{ color: C.blue, fontWeight: 800 }}>SE CONTINUI → </span>{b.next}</div>
            </Card>
          ))}

          <SectionTitle>Impostazioni</SectionTitle>
          <Card>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, marginBottom: 6 }}>DATA E ORA ULTIMO FUMO</div>
            <input type="datetime-local" value={state.quitAt} onChange={(e) => persist({ ...state, quitAt: e.target.value })}
              style={{ width: "100%", background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, color: C.ink, fontSize: 15, colorScheme: "dark", fontFamily: "inherit" }} />
          </Card>
          <Btn outline onClick={downloadMD}>⬇ Scarica diario (.md)</Btn>
        </>)}
      </div>

      {/* TAB BAR */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(16,19,24,0.97)",
        borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "center",
        padding: "8px 8px calc(8px + env(safe-area-inset-bottom))", gap: 2, backdropFilter: "blur(8px)",
      }}>
        {[["home", "🏠", "Home"], ["oggi", "☀️", "Oggi"], ["obiettivo", "🎯", "Obiettivo"], ["sezioni", "🧩", "Sezioni"], ["altro", "📈", "Altro"]].map(([id, ic, name]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, maxWidth: 110, padding: "8px 0", borderRadius: 12, border: "none", cursor: "pointer",
            background: tab === id ? `${C.blue}1E` : "transparent", color: tab === id ? C.blue : C.dim,
            fontWeight: 700, fontSize: 11, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}><span style={{ fontSize: 18 }}>{ic}</span>{name}</button>
        ))}
      </div>
    </div>
  );
}
