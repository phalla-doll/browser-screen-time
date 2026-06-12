import type { ReactNode } from "react"
import { useLiveQuery } from "dexie-react-hooks"

import { buildSessions } from "@/lib/analytics/sessions"
import { summarizeDeepWork, summarizeFocus } from "@/lib/analytics/metrics"
import type { Category } from "@/lib/categorization/categorize"
import type { Visit } from "@/lib/db/db"
import { categoryColor } from "@/lib/category-colors"
import { getVisitsBetween } from "@/lib/db/repository"
import { formatDuration } from "@/lib/format"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Favicon } from "../components/Favicon"
import { Sparkline } from "../components/Sparkline"
import { useTodayVisits } from "../use-today"

const DAY_MS = 24 * 60 * 60 * 1000
const toMin = (ms: number) => Math.round(ms / 60_000)

// Last 7 calendar days, oldest first.
function lastWeekDays(): Date[] {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - 6)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function visitsOnDay(visits: Visit[], day: Date): Visit[] {
  const start = day.getTime()
  return visits.filter((v) => v.startTs >= start && v.startTs < start + DAY_MS)
}

function topByDuration<K extends string>(
  visits: Visit[],
  keyOf: (v: Visit) => K
): { key: K; duration: number } | undefined {
  const totals = new Map<K, number>()
  for (const visit of visits) {
    totals.set(keyOf(visit), (totals.get(keyOf(visit)) ?? 0) + visit.duration)
  }
  let top: { key: K; duration: number } | undefined
  for (const [key, duration] of totals) {
    if (!top || duration > top.duration) {
      top = { key, duration }
    }
  }
  return top
}

function MetricCard({
  title,
  value,
  detail,
  accessory,
}: {
  title: string
  value: ReactNode
  detail?: string
  accessory?: ReactNode
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-1 text-2xl">{value}</CardTitle>
        </div>
        {accessory ? <div className="shrink-0">{accessory}</div> : null}
      </div>
      {detail ? (
        <div className="text-xs text-muted-foreground">{detail}</div>
      ) : null}
    </Card>
  )
}

export function Dashboard() {
  const visits = useTodayVisits()
  const days = lastWeekDays()
  const weekStart = days[0].getTime()
  const week = useLiveQuery(
    () => getVisitsBetween(weekStart, weekStart + 7 * DAY_MS),
    [weekStart]
  )

  if (visits === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (visits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No activity recorded yet today. Browse a few sites and these cards fill
        in live.
      </p>
    )
  }

  const focus = summarizeFocus(visits)
  const deepWork = summarizeDeepWork(buildSessions(visits))
  const topCategory = topByDuration(visits, (v) => v.category as Category)
  const topDomain = topByDuration(visits, (v) => v.domain)
  const topDomainIcon = topDomain
    ? visits.findLast((v) => v.domain === topDomain.key && v.favIconUrl)
        ?.favIconUrl
    : undefined

  // Per-day series for the card sparklines (undefined until the week loads).
  const perDay = week ? days.map((day) => visitsOnDay(week, day)) : undefined
  const totalSeries = perDay?.map((dv) =>
    toMin(dv.reduce((sum, v) => sum + v.duration, 0))
  )
  const focusSeries = perDay?.map((dv) =>
    Math.round(summarizeFocus(dv).focusScore * 100)
  )
  const deepSeries = perDay?.map((dv) =>
    toMin(summarizeDeepWork(buildSessions(dv)).totalMs)
  )
  const categorySeries =
    topCategory &&
    perDay?.map((dv) =>
      toMin(
        dv
          .filter((v) => v.category === topCategory.key)
          .reduce((sum, v) => sum + v.duration, 0)
      )
    )

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <MetricCard
        title="Total time today"
        value={formatDuration(focus.totalMs)}
        detail={`${visits.length} visits`}
        accessory={totalSeries ? <Sparkline data={totalSeries} /> : null}
      />
      <MetricCard
        title="Focus score"
        value={`${Math.round(focus.focusScore * 100)}%`}
        detail={`${formatDuration(focus.focusMs)} focused`}
        accessory={
          focusSeries ? <Sparkline data={focusSeries} color="#10b981" /> : null
        }
      />
      <MetricCard
        title="Deep work"
        value={formatDuration(deepWork.totalMs)}
        detail={`${deepWork.count} session${deepWork.count === 1 ? "" : "s"}`}
        accessory={deepSeries ? <Sparkline data={deepSeries} /> : null}
      />
      <MetricCard
        title="Top category"
        value={
          topCategory ? (
            <Badge className={categoryColor(topCategory.key).chip}>
              {topCategory.key}
            </Badge>
          ) : (
            "—"
          )
        }
        detail={topCategory ? formatDuration(topCategory.duration) : undefined}
        accessory={
          topCategory && categorySeries ? (
            <Sparkline
              data={categorySeries}
              color={categoryColor(topCategory.key).hex}
            />
          ) : null
        }
      />
      <MetricCard
        title="Most visited site"
        value={
          topDomain ? (
            <span className="truncate text-xl">{topDomain.key}</span>
          ) : (
            "—"
          )
        }
        detail={topDomain ? formatDuration(topDomain.duration) : undefined}
        accessory={
          topDomain ? (
            <Favicon
              src={topDomainIcon}
              domain={topDomain.key}
              className="size-8"
            />
          ) : null
        }
      />
    </div>
  )
}
