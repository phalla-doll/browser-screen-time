import { useMemo, useState } from "react"

import { CATEGORIES, type Category } from "@/lib/categorization/categorize"
import type { Visit } from "@/lib/db/db"
import { categoryColor } from "@/lib/category-colors"
import { formatClock, formatDuration } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Favicon } from "../components/Favicon"
import { useTodayVisits } from "../use-today"

const ALL = "All"

function hourLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit" })
}

// A row in the timeline. Consecutive visits to the same page are folded into a
// single row (summed duration, a count, and the span they cover).
interface TimelineRow {
  id: number
  domain: string
  title: string
  url: string
  category: Category
  favIconUrl?: string
  startTs: number
  lastTs: number
  duration: number
  count: number
}

// Collapse runs of consecutive same-URL visits into one row each.
function mergeRuns(visits: Visit[]): TimelineRow[] {
  const rows: TimelineRow[] = []
  for (const visit of visits) {
    const last = rows[rows.length - 1]
    if (last && last.url === visit.url) {
      last.duration += visit.duration
      last.lastTs = visit.startTs
      last.count += 1
      // The freshest title/favicon usually arrives on a later visit.
      if (visit.title) last.title = visit.title
      if (visit.favIconUrl) last.favIconUrl = visit.favIconUrl
    } else {
      rows.push({
        id: visit.id,
        domain: visit.domain,
        title: visit.title,
        url: visit.url,
        category: visit.category,
        favIconUrl: visit.favIconUrl,
        startTs: visit.startTs,
        lastTs: visit.startTs,
        duration: visit.duration,
        count: 1,
      })
    }
  }
  return rows
}

function groupByHour(rows: TimelineRow[]): { hour: string; rows: TimelineRow[] }[] {
  const groups: { hour: string; rows: TimelineRow[] }[] = []
  for (const row of rows) {
    const hour = hourLabel(row.startTs)
    const last = groups[groups.length - 1]
    if (last && last.hour === hour) {
      last.rows.push(row)
    } else {
      groups.push({ hour, rows: [row] })
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

  const groups = useMemo(() => groupByHour(mergeRuns(filtered)), [filtered])

  if (visits === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search site or title…"
          className="w-56"
        />
        <Select
          value={category}
          onValueChange={(value) =>
            setCategory(value as typeof ALL | Category)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              <ul className="min-w-0 flex-1 divide-y divide-border rounded-lg border border-border">
                {group.rows.map((row) => {
                  const color = categoryColor(row.category)
                  return (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Favicon src={row.favIconUrl} domain={row.domain} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                            {row.domain}
                            {row.count > 1 ? (
                              <span className="shrink-0 rounded bg-muted px-1 py-0.5 font-mono text-[10px] font-normal text-muted-foreground">
                                ×{row.count}
                              </span>
                            ) : null}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {row.title}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge className={color.chip}>{row.category}</Badge>
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-xs">
                            {formatDuration(row.duration)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {row.count > 1
                              ? `${formatClock(row.startTs)} – ${formatClock(row.lastTs)}`
                              : formatClock(row.startTs)}
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
