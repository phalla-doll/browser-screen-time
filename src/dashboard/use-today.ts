import { useLiveQuery } from "dexie-react-hooks"

import { getVisitsForDay } from "@/lib/db/repository"

// Today's visits, reactively updated as the background worker records.
// Returns undefined while the first query is in flight.
export function useTodayVisits() {
  return useLiveQuery(() => getVisitsForDay(new Date()), [])
}
