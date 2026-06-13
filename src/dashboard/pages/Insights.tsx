import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { generateInsights } from "@/lib/insights/generate"
import type { Insight, InsightKind } from "@/lib/insights/types"

import { useTodayVisits } from "../use-today"

const KIND_COLOR: Record<InsightKind, string> = {
  positive: "#10b981",
  warning: "#f59e0b",
  neutral: "#64748b",
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-1.5 size-2 shrink-0 rounded-full"
          style={{ backgroundColor: KIND_COLOR[insight.kind] }}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="text-sm">{insight.title}</CardTitle>
          {insight.detail ? (
            <CardDescription>{insight.detail}</CardDescription>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

export function Insights() {
  const visits = useTodayVisits()
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!visits) return
    setLoading(true)
    setError(null)
    try {
      setInsights(await generateInsights(visits))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate insights.")
    } finally {
      setLoading(false)
    }
  }

  const noData = visits !== undefined && visits.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">Insights</h2>
          <p className="text-sm text-muted-foreground">
            AI-generated observations about today's browsing. Generating sends a
            summary of your day to the NVIDIA model configured in Settings.
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || visits === undefined || noData}
        >
          {loading ? "Generating…" : "Generate insights"}
        </Button>
      </div>

      {noData ? (
        <p className="text-sm text-muted-foreground">
          No activity recorded yet today. Browse a few sites first.
        </p>
      ) : null}

      {error ? (
        <Card>
          <CardTitle className="text-sm" style={{ color: KIND_COLOR.warning }}>
            Couldn't generate insights
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </Card>
      ) : null}

      {insights ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      ) : null}

      {!insights && !error && !noData ? (
        <p className="text-sm text-muted-foreground">
          Click “Generate insights” to analyze today with AI.
        </p>
      ) : null}
    </div>
  )
}
