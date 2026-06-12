// Extract the registrable domain from a URL (e.g. https://mail.google.com/x
// → "google.com"). This is a lightweight heuristic, not a full Public Suffix
// List — good enough for categorization; revisit if multi-part TLD accuracy
// matters.

// Common multi-part public suffixes where the registrable domain is the last
// THREE labels (e.g. "bbc.co.uk") rather than the last two.
const MULTI_PART_TLDS = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "co.jp",
  "co.kr",
  "co.in",
  "co.nz",
  "co.za",
  "com.au",
  "com.br",
  "com.cn",
  "com.mx",
  "com.tr",
  "com.sg",
])

export function getRegistrableDomain(url: string): string | null {
  let hostname: string
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }
    hostname = parsed.hostname
  } catch {
    return null
  }

  if (!hostname) {
    return null
  }

  hostname = hostname.replace(/^www\./, "")
  const parts = hostname.split(".")
  if (parts.length <= 2) {
    return hostname
  }

  const lastTwo = parts.slice(-2).join(".")
  if (MULTI_PART_TLDS.has(lastTwo)) {
    return parts.slice(-3).join(".")
  }

  return lastTwo
}
