import type { Category } from "@/lib/categorization/categorize"

// One AI-generated observation about a day's browsing.
export type InsightKind = "positive" | "warning" | "neutral"

export interface Insight {
  title: string
  detail: string
  kind: InsightKind
}

// A compact, model-facing summary of a day. This — not raw visits — is what we
// send to the LLM: aggregated metrics plus the heaviest domains, never full
// URLs. Keep it small and stable; it doubles as the prompt's input contract.
export interface InsightContext {
  date: string // YYYY-MM-DD
  totalMs: number
  focusMs: number
  focusScore: number // 0..1
  sessionCount: number
  deepWorkCount: number
  deepWorkMs: number
  switches: number
  averageGapMs: number
  topTransition?: { from: string; to: string; count: number }
  categories: { category: Category; ms: number }[] // desc by ms
  topDomains: { domain: string; ms: number; category: Category }[] // desc by ms
}

// A single chat message in the OpenAI-compatible request shape.
export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}
