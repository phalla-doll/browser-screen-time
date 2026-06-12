import { useEffect, useMemo, useRef, useState } from "react"

import type { Visit } from "@/lib/db/db"
import { formatDuration } from "@/lib/format"

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

// GitHub's contribution palette (light greens, level 0 is theme-muted).
const LEVEL_COLORS = ["#9be9a8", "#40c463", "#30a14e", "#216e39"]

const LEFT_PAD = 28 // room for weekday labels
const TOP_PAD = 16 // room for month labels

interface Day {
  ts: number // local midnight
  total: number // total ms of activity that day
  level: number // 0–4 intensity bucket
}

function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

// Bucket a day's total into 0–4 relative to the busiest day in the window.
function levelFor(total: number, max: number): number {
  if (total <= 0 || max <= 0) {
    return 0
  }
  return Math.min(4, Math.ceil((total / max) * 4))
}

// Group visits into a grid of weeks (columns) × weekdays (rows), GitHub-style:
// the window ends today and starts on the Sunday ~35 weeks back.
function buildWeeks(visits: Visit[]): Day[][] {
  const totals = new Map<number, number>()
  for (const visit of visits) {
    const key = startOfDay(new Date(visit.startTs)).getTime()
    totals.set(key, (totals.get(key) ?? 0) + visit.duration)
  }

  const end = startOfDay(new Date()) // today
  const start = startOfDay(new Date(end.getTime() - 243 * DAY_MS)) // ~8 months
  start.setDate(start.getDate() - start.getDay()) // back to Sunday

  const max = Math.max(0, ...totals.values())

  const weeks: Day[][] = []
  const cursor = new Date(start)
  while (cursor.getTime() <= end.getTime()) {
    const week: Day[] = []
    for (let dow = 0; dow < 7; dow += 1) {
      const ts = cursor.getTime()
      const total = ts <= end.getTime() ? (totals.get(ts) ?? 0) : -1
      week.push({
        ts,
        total: Math.max(0, total),
        level: total < 0 ? -1 : levelFor(total, max),
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

// Month labels: a column gets a label when its first day starts a new month.
function monthLabels(
  weeks: Day[][],
  stride: number
): { x: number; label: string }[] {
  const labels: { x: number; label: string }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const firstReal = week.find((d) => d.level >= 0)
    if (!firstReal) {
      return
    }
    const month = new Date(firstReal.ts).getMonth()
    if (month !== lastMonth) {
      labels.push({ x: LEFT_PAD + col * stride, label: MONTHS[month] })
      lastMonth = month
    }
  })
  return labels
}

export function ContributionGraph({ visits }: { visits: Visit[] }) {
  const weeks = useMemo(() => buildWeeks(visits), [visits])

  // Measure the container so cells stretch to fill the card's full width.
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  useEffect(() => {
    const el = containerRef.current
    if (!el) {
      return
    }
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const available = Math.max(0, containerWidth - LEFT_PAD)
  const stride = weeks.length > 0 ? available / weeks.length : 0
  const gap = Math.min(6, Math.max(2, stride * 0.16))
  const cell = Math.max(0, stride - gap)
  const radius = Math.min(3, cell * 0.25)

  const labels = useMemo(() => monthLabels(weeks, stride), [weeks, stride])

  const height = TOP_PAD + 7 * stride
  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="w-full">
        <svg
          width="100%"
          height={height}
          role="img"
          aria-label="Browsing activity over the last 8 months"
        >
          {labels.map((m) => (
            <text
              key={`${m.label}-${m.x}`}
              x={m.x}
              y={10}
              className="fill-muted-foreground"
              fontSize={10}
            >
              {m.label}
            </text>
          ))}
          {[1, 3, 5].map((row) => (
            <text
              key={row}
              x={0}
              y={TOP_PAD + row * stride + cell - 1}
              className="fill-muted-foreground"
              fontSize={10}
            >
              {WEEKDAYS[row]}
            </text>
          ))}
          {weeks.map((week, col) =>
            week.map((day, row) => {
              if (day.level < 0) {
                return null // future day, leave blank
              }
              const x = LEFT_PAD + col * stride
              const y = TOP_PAD + row * stride
              const fill =
                day.level === 0
                  ? "var(--color-muted)"
                  : LEVEL_COLORS[day.level - 1]
              return (
                <rect
                  key={day.ts}
                  x={x}
                  y={y}
                  width={cell}
                  height={cell}
                  rx={radius}
                  ry={radius}
                  fill={fill}
                >
                  <title>
                    {day.total > 0
                      ? `${formatDuration(day.total)} on ${fmtDate(day.ts)}`
                      : `No activity on ${fmtDate(day.ts)}`}
                  </title>
                </rect>
              )
            })
          )}
        </svg>
      </div>
      <div className="flex items-center gap-1 self-end text-xs text-muted-foreground">
        <span>Less</span>
        <span
          className="inline-block size-[11px] rounded-[2px]"
          style={{ background: "var(--color-muted)" }}
        />
        {LEVEL_COLORS.map((c) => (
          <span
            key={c}
            className="inline-block size-[11px] rounded-[2px]"
            style={{ background: c }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
