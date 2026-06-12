import { useLiveQuery } from "dexie-react-hooks"

import { getVisitsForDay } from "@/lib/db/repository"
import { formatClock, formatDuration } from "@/lib/format"

// Dashboard shell. Router + full pages (Dashboard, Timeline, Analytics,
// Insights) land in Phase 5; this live view proves the tracking → storage →
// categorization pipeline end-to-end.
export function App() {
  const visits = useLiveQuery(() => getVisitsForDay(new Date()), [])

  const totalMs = visits?.reduce((sum, v) => sum + v.duration, 0) ?? 0
  // Most recent first.
  const recent = visits ? [...visits].reverse() : []

  return (
    <div className="min-h-svh bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header>
          <h1 className="text-xl font-medium">WebTimeline</h1>
          <p className="text-sm text-muted-foreground">
            Privacy-first browsing timeline & analytics — all local, no cloud.
          </p>
        </header>

        <div className="rounded-lg border border-border p-4">
          <div className="text-xs text-muted-foreground">Tracked today</div>
          <div className="text-2xl font-medium">{formatDuration(totalMs)}</div>
          <div className="text-xs text-muted-foreground">
            {visits?.length ?? 0} visits recorded
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">Recent activity</div>
          {visits === undefined ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No visits yet. Browse a few sites, then watch this list update
              live.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {recent.map((visit) => (
                <li
                  key={visit.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{visit.domain}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {visit.title}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="font-mono text-xs">
                      {formatDuration(visit.duration)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {visit.category} · {formatClock(visit.startTs)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}

export default App
