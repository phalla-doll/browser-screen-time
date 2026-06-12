import { db } from "@/lib/db/db"
import { getVisitsForDay } from "@/lib/db/repository"

import { buildSessions } from "./sessions"

// Recompute the given day's sessions from its visits and persist them:
// replace that day's session rows and backfill each visit's sessionId. Pure
// session logic lives in buildSessions; this is the IndexedDB-facing wrapper.
export async function rebuildSessionsForDay(date: Date): Promise<void> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const dayStart = start.getTime()
  const dayEnd = dayStart + 24 * 60 * 60 * 1000

  const visits = await getVisitsForDay(date)
  const sessions = buildSessions(visits)

  await db.transaction("rw", db.sessions, db.visits, async () => {
    const staleIds = await db.sessions
      .where("startTs")
      .between(dayStart, dayEnd, true, false)
      .primaryKeys()
    await db.sessions.bulkDelete(staleIds)

    for (const session of sessions) {
      const sessionId = await db.sessions.add({
        label: session.dominantCategory,
        startTs: session.startTs,
        endTs: session.endTs,
        category: session.dominantCategory,
      })
      await db.visits
        .where("id")
        .anyOf(session.visitIds)
        .modify({ sessionId })
    }
  })
}
