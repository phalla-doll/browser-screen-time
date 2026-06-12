import type { Category } from "@/lib/categorization/categorize"
import type { Visit } from "@/lib/db/db"

// Test-only helper: build a Visit from minute offsets so fixtures read clearly.
const BASE_TS = 1_700_000_000_000 // fixed epoch; arbitrary but stable

let nextId = 1

export function resetVisitIds(): void {
  nextId = 1
}

export function makeVisit(opts: {
  domain: string
  category: Category
  startMin: number
  durMin: number
}): Visit {
  const startTs = BASE_TS + opts.startMin * 60_000
  const duration = opts.durMin * 60_000
  return {
    id: nextId++,
    domain: opts.domain,
    title: opts.domain,
    url: `https://${opts.domain}/`,
    startTs,
    endTs: startTs + duration,
    duration,
    category: opts.category,
  }
}
