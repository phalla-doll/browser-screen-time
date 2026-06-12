import { useLiveQuery } from "dexie-react-hooks"

import { getVisitsBetween, getVisitsForDay } from "@/lib/db/repository"

const DAY_MS = 24 * 60 * 60 * 1000

// Today's visits, reactively updated as the background worker records.
// Returns undefined while the first query is in flight.
export function useTodayVisits() {
  return useLiveQuery(() => getVisitsForDay(new Date()), [])
}

// The trailing ~27 weeks of visits, for the GitHub-style contribution graph.
// Returns undefined while the first query is in flight.
export function useContributionVisits() {
  return useLiveQuery(() => {
    const end = new Date()
    end.setHours(24, 0, 0, 0) // start of tomorrow, so today is included
    const from = end.getTime() - 189 * DAY_MS // 27 weeks
    return getVisitsBetween(from, end.getTime())
  }, [])
}
