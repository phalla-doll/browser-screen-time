import type { Category } from "@/lib/categorization/categorize"

export interface CategoryColor {
  chip: string // badge background + text classes
  dot: string // solid swatch for legends/timelines
  hex: string // raw value for chart fills (Recharts)
}

// Per-category accent colors. Tailwind palette utilities (not theme tokens) so
// categories stay visually distinct in both light and dark mode; hex mirrors
// the -500 shade for SVG charts.
const COLORS: Record<Category, CategoryColor> = {
  Development: {
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
  AI: {
    chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
    hex: "#8b5cf6",
  },
  Documentation: {
    chip: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
  },
  Communication: {
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  Social: {
    chip: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
    dot: "bg-pink-500",
    hex: "#ec4899",
  },
  Entertainment: {
    chip: "bg-red-500/15 text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    hex: "#ef4444",
  },
  Shopping: {
    chip: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500",
    hex: "#14b8a6",
  },
  News: {
    chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
    hex: "#f97316",
  },
  Uncategorized: {
    chip: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
    hex: "#a1a1aa",
  },
}

export function categoryColor(category: Category): CategoryColor {
  return COLORS[category] ?? COLORS.Uncategorized
}
