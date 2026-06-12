import { DOMAIN_CATEGORY_RULES } from "./rules"

export const CATEGORIES = [
  "Development",
  "AI",
  "Documentation",
  "Communication",
  "Social",
  "Entertainment",
  "Shopping",
  "News",
  "Uncategorized",
] as const

export type Category = (typeof CATEGORIES)[number]

// Map a registrable domain to a category via the built-in rule table.
//
// AI-fallback seam: when no rule matches we return "Uncategorized" today. A
// later phase can consult an AI classifier here before giving up (kept as an
// explicit, isolated extension point — see the deferred plan).
export function categorize(domain: string): Category {
  return DOMAIN_CATEGORY_RULES[domain] ?? "Uncategorized"
}
