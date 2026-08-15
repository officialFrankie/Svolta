/**
 * Estrazione JSON robusta dalle risposte AI: toglie i code fence, poi prova il
 * parse diretto, poi ritaglia dal primo { (o [) all'ultimo } (o ]).
 * Mai un throw: se non c'è JSON valido torna null e chi chiama gestisce il fallback.
 */
export function extractJSON<T = unknown>(text: string): T | null {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    /* continua */
  }
  for (const [open, close] of [
    ["{", "}"],
    ["[", "]"],
  ] as const) {
    const start = cleaned.indexOf(open);
    const end = cleaned.lastIndexOf(close);
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        /* prova il prossimo */
      }
    }
  }
  return null;
}

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
