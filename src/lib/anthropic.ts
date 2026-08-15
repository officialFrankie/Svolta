import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY mancante: aggiungila a .env.local");
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

/**
 * Chiamata al modello con retry ed exponential backoff.
 * Torna il testo concatenato dei blocchi text; lancia solo dopo tutti i tentativi.
 */
export async function callClaude(
  content: string | ContentBlock[],
  opts: { maxTokens?: number; retries?: number } = {}
): Promise<string> {
  const { maxTokens = 1500, retries = 2 } = opts;
  const blocks = typeof content === "string" ? [{ type: "text" as const, text: content }] : content;

  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const msg = await getClient().messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: blocks as Anthropic.ContentBlockParam[] }],
      });
      const txt = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (!txt) throw new Error("Risposta vuota dall'AI");
      return txt;
    } catch (e) {
      lastErr = e;
      // niente retry su chiave mancante/invalida
      const status = (e as { status?: number })?.status;
      if (status === 401 || status === 403 || (e as Error)?.message?.includes("ANTHROPIC_API_KEY")) break;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Chiamata AI fallita");
}
