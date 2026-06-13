import type { Insight, InsightKind } from "./types"

const KINDS: ReadonlySet<InsightKind> = new Set<InsightKind>([
  "positive",
  "warning",
  "neutral",
])

// Strip a ```json ... ``` (or bare ```) fence if the model wrapped its reply,
// then narrow to the outermost {...} so trailing prose can't break JSON.parse.
function extractJson(raw: string): string {
  let text = raw.trim()
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fence) {
    text = fence[1].trim()
  }
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start !== -1 && end > start) {
    text = text.slice(start, end + 1)
  }
  return text
}

function coerceKind(value: unknown): InsightKind {
  return typeof value === "string" && KINDS.has(value as InsightKind)
    ? (value as InsightKind)
    : "neutral"
}

// Parse the model's reply into validated insights. Tolerant of code fences and
// missing fields; throws only when no usable insight array is present so the UI
// can surface a clear error instead of rendering garbage.
export function parseInsights(raw: string): Insight[] {
  let data: unknown
  try {
    data = JSON.parse(extractJson(raw))
  } catch {
    throw new Error("Model did not return valid JSON.")
  }

  const list = (data as { insights?: unknown })?.insights
  if (!Array.isArray(list)) {
    throw new Error("Model response did not contain an insights array.")
  }

  const insights = list
    .map((item) => item as Record<string, unknown>)
    .filter((item) => item && typeof item.title === "string")
    .map((item) => ({
      title: String(item.title).trim(),
      detail: typeof item.detail === "string" ? item.detail.trim() : "",
      kind: coerceKind(item.kind),
    }))

  if (insights.length === 0) {
    throw new Error("Model returned no usable insights.")
  }
  return insights
}
