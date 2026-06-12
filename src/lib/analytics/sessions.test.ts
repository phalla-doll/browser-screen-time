import { beforeEach, describe, expect, it } from "vitest"

import { makeVisit, resetVisitIds } from "./fixtures"
import { buildSessions } from "./sessions"

beforeEach(resetVisitIds)

describe("buildSessions", () => {
  it("returns no sessions for an empty list", () => {
    expect(buildSessions([])).toEqual([])
  })

  it("groups visits within the idle gap into one session", () => {
    const sessions = buildSessions([
      makeVisit({
        domain: "github.com",
        category: "Development",
        startMin: 0,
        durMin: 20,
      }),
      makeVisit({
        domain: "claude.ai",
        category: "AI",
        startMin: 25,
        durMin: 10,
      }),
    ])

    expect(sessions).toHaveLength(1)
    expect(sessions[0].activeMs).toBe(30 * 60_000)
    expect(sessions[0].domains).toEqual(["github.com", "claude.ai"])
    expect(sessions[0].switches).toBe(1)
    expect(sessions[0].focusScore).toBe(1)
  })

  it("splits on an idle gap larger than the threshold", () => {
    const sessions = buildSessions([
      makeVisit({
        domain: "github.com",
        category: "Development",
        startMin: 0,
        durMin: 20,
      }),
      // starts 40 min after the previous visit ended → new session
      makeVisit({
        domain: "youtube.com",
        category: "Entertainment",
        startMin: 60,
        durMin: 15,
      }),
    ])

    expect(sessions).toHaveLength(2)
    expect(sessions[0].dominantCategory).toBe("Development")
    expect(sessions[1].dominantCategory).toBe("Entertainment")
    expect(sessions[1].focusScore).toBe(0)
  })

  it("computes a partial focus score and dominant category", () => {
    const [session] = buildSessions([
      makeVisit({
        domain: "github.com",
        category: "Development",
        startMin: 0,
        durMin: 30,
      }),
      makeVisit({
        domain: "youtube.com",
        category: "Entertainment",
        startMin: 30,
        durMin: 10,
      }),
    ])

    expect(session.focusScore).toBeCloseTo(0.75)
    expect(session.dominantCategory).toBe("Development")
    expect(session.categoryBreakdown).toEqual({
      Development: 30 * 60_000,
      Entertainment: 10 * 60_000,
    })
  })
})
