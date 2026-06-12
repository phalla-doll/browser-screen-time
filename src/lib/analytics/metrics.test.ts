import { beforeEach, describe, expect, it } from "vitest"

import { makeVisit, resetVisitIds } from "./fixtures"
import {
  summarizeContextSwitching,
  summarizeDeepWork,
  summarizeFocus,
} from "./metrics"
import { buildSessions } from "./sessions"

beforeEach(resetVisitIds)

describe("summarizeFocus", () => {
  it("scores focused time against total time", () => {
    const summary = summarizeFocus([
      makeVisit({ domain: "github.com", category: "Development", startMin: 0, durMin: 30 }),
      makeVisit({ domain: "youtube.com", category: "Entertainment", startMin: 30, durMin: 10 }),
    ])
    expect(summary.totalMs).toBe(40 * 60_000)
    expect(summary.focusMs).toBe(30 * 60_000)
    expect(summary.focusScore).toBeCloseTo(0.75)
  })

  it("is zero for empty input", () => {
    expect(summarizeFocus([]).focusScore).toBe(0)
  })
})

describe("summarizeDeepWork", () => {
  it("counts long, focused, low-churn sessions", () => {
    const sessions = buildSessions([
      makeVisit({ domain: "github.com", category: "Development", startMin: 0, durMin: 20 }),
      makeVisit({ domain: "developer.mozilla.org", category: "Documentation", startMin: 20, durMin: 20 }),
    ])
    const summary = summarizeDeepWork(sessions)
    expect(summary.count).toBe(1)
    expect(summary.totalMs).toBe(40 * 60_000)
  })

  it("excludes short sessions", () => {
    const sessions = buildSessions([
      makeVisit({ domain: "github.com", category: "Development", startMin: 0, durMin: 10 }),
    ])
    expect(summarizeDeepWork(sessions).count).toBe(0)
  })

  it("excludes unfocused sessions", () => {
    const sessions = buildSessions([
      makeVisit({ domain: "youtube.com", category: "Entertainment", startMin: 0, durMin: 45 }),
    ])
    expect(summarizeDeepWork(sessions).count).toBe(0)
  })
})

describe("summarizeContextSwitching", () => {
  it("counts domain changes, average gap, and the top transition", () => {
    const summary = summarizeContextSwitching([
      makeVisit({ domain: "github.com", category: "Development", startMin: 0, durMin: 10 }),
      // 5 min gap, then switch
      makeVisit({ domain: "claude.ai", category: "AI", startMin: 15, durMin: 10 }),
      // back to github immediately
      makeVisit({ domain: "github.com", category: "Development", startMin: 25, durMin: 10 }),
    ])
    expect(summary.switches).toBe(2)
    expect(summary.averageGapMs).toBeCloseTo((5 * 60_000 + 0) / 2)
    expect(summary.topTransition?.count).toBe(1)
  })

  it("reports no switching for a single visit", () => {
    const summary = summarizeContextSwitching([
      makeVisit({ domain: "github.com", category: "Development", startMin: 0, durMin: 10 }),
    ])
    expect(summary.switches).toBe(0)
    expect(summary.averageGapMs).toBe(0)
  })
})
