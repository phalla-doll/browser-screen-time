import { buildSessions } from "@/lib/analytics/sessions"
import {
  summarizeContextSwitching,
  summarizeDeepWork,
  summarizeFocus,
} from "@/lib/analytics/metrics"
import type { Category } from "@/lib/categorization/categorize"
import type { Visit } from "@/lib/db/db"

import type { InsightContext } from "./types"

const TOP_DOMAINS = 8

function localDateString(ts: number): string {
  const d = new Date(ts)
  const month = `${d.getMonth() + 1}`.padStart(2, "0")
  const day = `${d.getDate()}`.padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

// Reduce a day's raw visits to the aggregated summary we feed the model. Pure
// (no DB, no network) so the prompt input stays unit-testable; it reuses the
// same analytics primitives the dashboard cards are built on.
export function buildInsightContext(
  visits: Visit[],
  now: number = Date.now()
): InsightContext {
  const sessions = buildSessions(visits)
  const focus = summarizeFocus(visits)
  const deep = summarizeDeepWork(sessions)
  const ctx = summarizeContextSwitching(visits)

  const categoryMs = new Map<Category, number>()
  const domainMs = new Map<string, { ms: number; category: Category }>()
  for (const visit of visits) {
    categoryMs.set(
      visit.category,
      (categoryMs.get(visit.category) ?? 0) + visit.duration
    )
    const entry = domainMs.get(visit.domain) ?? {
      ms: 0,
      category: visit.category,
    }
    entry.ms += visit.duration
    domainMs.set(visit.domain, entry)
  }

  const categories = [...categoryMs.entries()]
    .map(([category, ms]) => ({ category, ms }))
    .sort((a, b) => b.ms - a.ms)

  const topDomains = [...domainMs.entries()]
    .map(([domain, { ms, category }]) => ({ domain, ms, category }))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, TOP_DOMAINS)

  return {
    date: localDateString(visits[0]?.startTs ?? now),
    totalMs: focus.totalMs,
    focusMs: focus.focusMs,
    focusScore: focus.focusScore,
    sessionCount: sessions.length,
    deepWorkCount: deep.count,
    deepWorkMs: deep.totalMs,
    switches: ctx.switches,
    averageGapMs: ctx.averageGapMs,
    topTransition: ctx.topTransition,
    categories,
    topDomains,
  }
}
