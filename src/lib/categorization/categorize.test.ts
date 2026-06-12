import { describe, expect, it } from "vitest"

import { categorize } from "./categorize"

describe("categorize", () => {
  it("maps known domains to their category", () => {
    expect(categorize("github.com")).toBe("Development")
    expect(categorize("claude.ai")).toBe("AI")
    expect(categorize("youtube.com")).toBe("Entertainment")
    expect(categorize("nytimes.com")).toBe("News")
  })

  it("falls back to Uncategorized for unknown domains", () => {
    expect(categorize("some-random-blog.example")).toBe("Uncategorized")
  })
})
