import type { ReactNode } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { summarizeFocus } from "@/lib/analytics/metrics"
import { CATEGORIES } from "@/lib/categorization/categorize"
import type { Visit } from "@/lib/db/db"
import { categoryColor } from "@/lib/category-colors"
import { getVisitsBetween } from "@/lib/db/repository"
import { formatDuration } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { ContributionGraph } from "../components/ContributionGraph"
import { Favicon } from "../components/Favicon"
import { useContributionVisits, useTodayVisits } from "../use-today"

const DAY_MS = 24 * 60 * 60 * 1000
const toMin = (ms: number) => Math.round(ms / 60_000)

const axisTick = { fill: "var(--color-muted-foreground)", fontSize: 12 }
const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-popover-foreground)",
  fontSize: 12,
}

function sumByCategory(visits: Visit[]) {
  return CATEGORIES.map((name) => ({
    name,
    value: toMin(
      visits
        .filter((v) => v.category === name)
        .reduce((sum, v) => sum + v.duration, 0)
    ),
    fill: categoryColor(name).hex,
  })).filter((d) => d.value > 0)
}

function sumByHour(visits: Visit[]) {
  if (visits.length === 0) {
    return []
  }
  const byHour = new Array(24).fill(0)
  for (const visit of visits) {
    byHour[new Date(visit.startTs).getHours()] += visit.duration
  }
  const active = byHour.flatMap((ms, hour) => (ms > 0 ? [hour] : []))
  const from = Math.min(...active)
  const to = Math.max(...active)
  const data = []
  for (let hour = from; hour <= to; hour += 1) {
    data.push({
      label: `${hour}`.padStart(2, "0"),
      minutes: toMin(byHour[hour]),
    })
  }
  return data
}

function topSites(visits: Visit[]) {
  const totals = new Map<string, number>()
  const icons = new Map<string, string>()
  for (const visit of visits) {
    totals.set(visit.domain, (totals.get(visit.domain) ?? 0) + visit.duration)
    // Visits arrive chronologically, so the latest favicon wins.
    if (visit.favIconUrl) {
      icons.set(visit.domain, visit.favIconUrl)
    }
  }
  return [...totals.entries()]
    .map(([domain, duration]) => ({
      domain,
      duration,
      favIconUrl: icons.get(domain),
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5)
}

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

function weeklyData(visits: Visit[], days: Date[]) {
  return days.map((day) => {
    const dayStart = day.getTime()
    const inDay = visits.filter(
      (v) => v.startTs >= dayStart && v.startTs < dayStart + DAY_MS
    )
    const focus = summarizeFocus(inDay)
    return {
      label: day.toLocaleDateString([], { weekday: "short" }),
      minutes: toMin(focus.totalMs),
      focusPct: Math.round(focus.focusScore * 100),
    }
  })
}

function ChartCard({
  title,
  children,
  empty,
}: {
  title: string
  children: ReactNode
  empty: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

export function Analytics() {
  const today = useTodayVisits()
  const yearVisits = useContributionVisits()
  const days = lastWeekDays()
  const weekStart = days[0].getTime()
  const week = useLiveQuery(
    () => getVisitsBetween(weekStart, weekStart + 7 * DAY_MS),
    [weekStart]
  )

  if (today === undefined || week === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  const categoryData = sumByCategory(today)
  const hourData = sumByHour(today)
  const weekData = weeklyData(week, days)
  const sites = topSites(today)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title="Time by category (today)"
        empty={categoryData.length === 0}
      >
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
            >
              {categoryData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [`${value}m`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Activity by hour (today)" empty={hourData.length === 0}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={hourData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="label"
              tick={axisTick}
              stroke="var(--color-border)"
            />
            <YAxis tick={axisTick} stroke="var(--color-border)" width={28} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--color-muted)" }}
              formatter={(value) => [`${value}m`, "Active"]}
            />
            <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Daily total (last 7 days)" empty={false}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="label"
              tick={axisTick}
              stroke="var(--color-border)"
            />
            <YAxis tick={axisTick} stroke="var(--color-border)" width={28} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--color-muted)" }}
              formatter={(value) => [`${value}m`, "Total"]}
            />
            <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Focus score trend (last 7 days)" empty={false}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="label"
              tick={axisTick}
              stroke="var(--color-border)"
            />
            <YAxis
              tick={axisTick}
              stroke="var(--color-border)"
              width={32}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [`${value}%`, "Focus"]}
            />
            <Line
              type="monotone"
              dataKey="focusPct"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Top sites (today)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          {sites.length === 0 ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            sites.map((s) => (
              <div
                key={s.domain}
                className="flex items-center justify-between gap-2 border-b py-2 text-sm last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Favicon src={s.favIconUrl} domain={s.domain} />
                  <span className="truncate">{s.domain}</span>
                </div>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {formatDuration(s.duration)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Activity (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          {yearVisits === undefined ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : (
            <ContributionGraph visits={yearVisits} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
