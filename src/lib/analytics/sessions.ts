import type { Category } from "@/lib/categorization/categorize"
import type { Visit } from "@/lib/db/db"

// A session is a run of consecutive visits with no idle gap longer than this.
export const SESSION_IDLE_GAP_MS = 30 * 60 * 1000 // 30 min

// Categories that count as focused/productive work.
export const FOCUS_CATEGORIES: ReadonlySet<Category> = new Set<Category>([
  "Development",
  "AI",
  "Documentation",
])

export function isFocusCategory(category: Category): boolean {
  return FOCUS_CATEGORIES.has(category)
}

// Derived statistics for one reconstructed session. Pure data — no DB id.
export interface SessionStats {
  startTs: number
  endTs: number
  activeMs: number // sum of visit durations (attention time)
  spanMs: number // wall-clock from first start to last end
  visitIds: number[]
  domains: string[] // unique, in first-seen order
  categoryBreakdown: Partial<Record<Category, number>> // ms per category
  dominantCategory: Category
  focusScore: number // focused activeMs / activeMs, 0..1
  switches: number // domain changes within the session
}

function summarize(visits: Visit[]): SessionStats {
  const startTs = visits[0].startTs
  let endTs = visits[0].endTs
  let activeMs = 0
  let focusMs = 0
  let switches = 0
  const domains: string[] = []
  const categoryBreakdown: Partial<Record<Category, number>> = {}

  visits.forEach((visit, index) => {
    endTs = Math.max(endTs, visit.endTs)
    activeMs += visit.duration
    if (isFocusCategory(visit.category)) {
      focusMs += visit.duration
    }
    categoryBreakdown[visit.category] =
      (categoryBreakdown[visit.category] ?? 0) + visit.duration
    if (!domains.includes(visit.domain)) {
      domains.push(visit.domain)
    }
    if (index > 0 && visit.domain !== visits[index - 1].domain) {
      switches += 1
    }
  })

  const dominantCategory = (Object.entries(categoryBreakdown) as [
    Category,
    number,
  ][]).reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0]

  return {
    startTs,
    endTs,
    activeMs,
    spanMs: endTs - startTs,
    visitIds: visits.map((v) => v.id),
    domains,
    categoryBreakdown,
    dominantCategory,
    focusScore: activeMs > 0 ? focusMs / activeMs : 0,
    switches,
  }
}

// Group visits into sessions, splitting whenever the idle gap between one
// visit's end and the next visit's start exceeds the threshold. Visits are
// sorted defensively; empty input yields no sessions.
export function buildSessions(
  visits: Visit[],
  idleGapMs: number = SESSION_IDLE_GAP_MS
): SessionStats[] {
  if (visits.length === 0) {
    return []
  }

  const ordered = [...visits].sort((a, b) => a.startTs - b.startTs)
  const sessions: SessionStats[] = []
  let current: Visit[] = [ordered[0]]
  let lastEnd = ordered[0].endTs

  for (let i = 1; i < ordered.length; i += 1) {
    const visit = ordered[i]
    if (visit.startTs - lastEnd > idleGapMs) {
      sessions.push(summarize(current))
      current = []
    }
    current.push(visit)
    lastEnd = Math.max(lastEnd, visit.endTs)
  }
  sessions.push(summarize(current))

  return sessions
}
