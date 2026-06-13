import { describe, expect, it } from "vitest"

import { parseInsights } from "./parse"

describe("parseInsights", () => {
  it("parses a clean JSON object", () => {
    const raw = JSON.stringify({
      insights: [
        { title: "Strong focus", detail: "2h of deep work.", kind: "positive" },
      ],
    })
    expect(parseInsights(raw)).toEqual([
      { title: "Strong focus", detail: "2h of deep work.", kind: "positive" },
    ])
  })

  it("strips a ```json code fence", () => {
    const raw =
      '```json\n{"insights":[{"title":"T","detail":"D","kind":"warning"}]}\n```'
    expect(parseInsights(raw)[0].kind).toBe("warning")
  })

  it("ignores prose around the JSON object", () => {
    const raw =
      'Here you go:\n{"insights":[{"title":"T","detail":"D","kind":"neutral"}]}\nHope that helps!'
    expect(parseInsights(raw)).toHaveLength(1)
  })

  it("defaults an unknown kind to neutral", () => {
    const raw = '{"insights":[{"title":"T","detail":"D","kind":"weird"}]}'
    expect(parseInsights(raw)[0].kind).toBe("neutral")
  })

  it("drops entries without a title", () => {
    const raw =
      '{"insights":[{"detail":"no title"},{"title":"Keep","detail":"D"}]}'
    const result = parseInsights(raw)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe("Keep")
  })

  it("throws on non-JSON", () => {
    expect(() => parseInsights("not json at all")).toThrow()
  })

  it("throws when there is no insights array", () => {
    expect(() => parseInsights('{"foo":1}')).toThrow()
  })
})
