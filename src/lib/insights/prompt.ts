import type { ChatMessage, InsightContext } from "./types"

const SYSTEM_PROMPT = `You are a productivity analyst for a privacy-first browsing tracker.
You receive a JSON summary of one day of a person's web browsing: time totals
(milliseconds), a focus score (0..1, share of time in focus categories),
deep-work blocks, context switches, the most frequent domain transition, and
the heaviest categories and domains.

Write 3 to 5 short, specific, non-judgmental insights about their day. Prefer
concrete numbers (convert milliseconds to minutes/hours). Call out focus wins,
distraction loops (use topTransition), and notable category balance. Do not
invent data not present in the summary.

Respond with ONLY a JSON object, no markdown, in exactly this shape:
{"insights":[{"title":"...","detail":"...","kind":"positive|warning|neutral"}]}
- "title": <= 8 words.
- "detail": one sentence.
- "kind": "positive" for wins, "warning" for distraction/risk, else "neutral".`

// Build the OpenAI-compatible message array from a day's summary. Pure so the
// exact prompt can be asserted in tests.
export function buildMessages(context: InsightContext): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(context) },
  ]
}
