import type { ReactNode } from "react"

import { buildSessions } from "@/lib/analytics/sessions"
import { summarizeDeepWork, summarizeFocus } from "@/lib/analytics/metrics"
import type { Category } from "@/lib/categorization/categorize"
import type { Visit } from "@/lib/db/db"
import { categoryColor } from "@/lib/category-colors"
import { formatDuration } from "@/lib/format"
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Favicon } from "../components/Favicon"
import { useTodayVisits } from "../use-today"

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
}: {
  title: string
  value: ReactNode
  detail?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {detail ? <CardContent className="text-xs text-muted-foreground">{detail}</CardContent> : null}
    </Card>
  )
}

export function Dashboard() {
  const visits = useTodayVisits()

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

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <MetricCard
        title="Total time today"
        value={formatDuration(focus.totalMs)}
        detail={`${visits.length} visits`}
      />
      <MetricCard
        title="Focus score"
        value={`${Math.round(focus.focusScore * 100)}%`}
        detail={`${formatDuration(focus.focusMs)} focused`}
      />
      <MetricCard
        title="Deep work"
        value={formatDuration(deepWork.totalMs)}
        detail={`${deepWork.count} session${deepWork.count === 1 ? "" : "s"}`}
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
      />
      <MetricCard
        title="Most visited site"
        value={
          topDomain ? (
            <span className="flex min-w-0 items-center gap-2">
              <Favicon
                src={topDomainIcon}
                domain={topDomain.key}
                className="size-5"
              />
              <span className="truncate text-xl">{topDomain.key}</span>
            </span>
          ) : (
            "—"
          )
        }
        detail={topDomain ? formatDuration(topDomain.duration) : undefined}
      />
    </div>
  )
}
