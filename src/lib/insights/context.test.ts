import { describe, expect, it } from "vitest"

import type { Category } from "@/lib/categorization/categorize"
import type { Visit } from "@/lib/db/db"

import { buildInsightContext } from "./context"

const MIN = 60_000

let nextId = 1
function visit(
  domain: string,
  category: Category,
  startMin: number,
  durMin: number
): Visit {
  const startTs = startMin * MIN
  const duration = durMin * MIN
  return {
    id: nextId++,
    domain,
    title: domain,
    url: `https://${domain}/`,
    startTs,
    endTs: startTs + duration,
    duration,
    category,
  }
}

describe("buildInsightContext", () => {
  it("aggregates focus, categories, and top domains", () => {
    const visits = [
      visit("github.com", "Development", 0, 40),
      visit("youtube.com", "Entertainment", 41, 20),
      visit("github.com", "Development", 62, 30),
    ]

    const ctx = buildInsightContext(visits)

    expect(ctx.totalMs).toBe(90 * MIN)
    expect(ctx.focusMs).toBe(70 * MIN) // both github visits
    expect(ctx.focusScore).toBeCloseTo(70 / 90)
    // github leads on time despite being split across two visits
    expect(ctx.topDomains[0]).toMatchObject({
      domain: "github.com",
      ms: 70 * MIN,
    })
    expect(ctx.categories[0].category).toBe("Development")
  })

  it("derives the date from the first visit, not now", () => {
    const visits = [visit("github.com", "Development", 0, 10)]
    // startTs is 0 -> 1970-01-01 in local time; assert the year prefix only to
    // stay timezone-agnostic.
    expect(buildInsightContext(visits, 999).date.startsWith("19")).toBe(true)
  })

  it("captures the top transition between domains", () => {
    const visits = [
      visit("github.com", "Development", 0, 10),
      visit("youtube.com", "Entertainment", 11, 10),
      visit("github.com", "Development", 22, 10),
      visit("youtube.com", "Entertainment", 33, 10),
    ]
    expect(buildInsightContext(visits).topTransition).toBeDefined()
  })
})
