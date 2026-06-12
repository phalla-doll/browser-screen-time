import { describe, expect, it } from "vitest"

import { formatDuration } from "./format"

describe("formatDuration", () => {
  it("formats sub-minute durations as seconds", () => {
    expect(formatDuration(5000)).toBe("5s")
  })

  it("formats minutes with seconds", () => {
    expect(formatDuration(125000)).toBe("2m 5s")
  })

  it("formats hours with minutes", () => {
    expect(formatDuration(5025000)).toBe("1h 23m")
  })

  it("rounds to the nearest second", () => {
    expect(formatDuration(1499)).toBe("1s")
    expect(formatDuration(1500)).toBe("2s")
  })
})
