import { describe, expect, it } from "vitest"

import { getRegistrableDomain } from "./domain"

describe("getRegistrableDomain", () => {
  it("strips the www prefix", () => {
    expect(getRegistrableDomain("https://www.github.com/foo")).toBe("github.com")
  })

  it("reduces subdomains to the registrable domain", () => {
    expect(getRegistrableDomain("https://mail.google.com/mail/u/0")).toBe(
      "google.com"
    )
  })

  it("handles multi-part TLDs", () => {
    expect(getRegistrableDomain("https://www.bbc.co.uk/news")).toBe("bbc.co.uk")
  })

  it("keeps bare two-label hosts", () => {
    expect(getRegistrableDomain("http://example.com")).toBe("example.com")
  })

  it("returns null for non-http(s) schemes", () => {
    expect(getRegistrableDomain("chrome://extensions")).toBeNull()
    expect(getRegistrableDomain("about:blank")).toBeNull()
  })

  it("returns null for malformed URLs", () => {
    expect(getRegistrableDomain("not a url")).toBeNull()
  })
})
