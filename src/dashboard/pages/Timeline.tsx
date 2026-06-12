import { useMemo, useState } from "react"

import { CATEGORIES, type Category } from "@/lib/categorization/categorize"
import type { Visit } from "@/lib/db/db"
import { categoryColor } from "@/lib/category-colors"
import { formatClock, formatDuration } from "@/lib/format"
import { Badge } from "@/components/ui/badge"

import { useTodayVisits } from "../use-today"

const ALL = "All"

function hourLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit" })
}

function groupByHour(visits: Visit[]): { hour: string; visits: Visit[] }[] {
  const groups: { hour: string; visits: Visit[] }[] = []
  for (const visit of visits) {
    const hour = hourLabel(visit.startTs)
    const last = groups[groups.length - 1]
    if (last && last.hour === hour) {
      last.visits.push(visit)
    } else {
      groups.push({ hour, visits: [visit] })
    }
  }
  return groups
}

export function Timeline() {
  const visits = useTodayVisits()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<typeof ALL | Category>(ALL)

  const filtered = useMemo(() => {
    if (!visits) {
      return []
    }
    const needle = search.trim().toLowerCase()
    return visits.filter((visit) => {
      if (category !== ALL && visit.category !== category) {
        return false
      }
      if (
        needle &&
        !visit.domain.toLowerCase().includes(needle) &&
        !visit.title.toLowerCase().includes(needle)
      ) {
        return false
      }
      return true
    })
  }, [visits, search, category])

  const groups = useMemo(() => groupByHour(filtered), [filtered])

  if (visits === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search site or title…"
          className="h-9 w-56 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as typeof ALL | Category)
          }
          className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value={ALL}>All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} visit{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matching visits.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.hour} className="flex gap-4">
              <div className="w-14 shrink-0 pt-2 text-xs font-medium text-muted-foreground">
                {group.hour}
              </div>
              <ul className="flex-1 divide-y divide-border rounded-lg border border-border">
                {group.visits.map((visit) => {
                  const color = categoryColor(visit.category)
                  return (
                    <li
                      key={visit.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`size-2 shrink-0 rounded-full ${color.dot}`}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {visit.domain}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {visit.title}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge className={color.chip}>{visit.category}</Badge>
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-xs">
                            {formatDuration(visit.duration)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatClock(visit.startTs)}
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
