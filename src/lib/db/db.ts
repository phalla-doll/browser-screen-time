import Dexie, { type EntityTable } from "dexie"

import type { Category } from "@/lib/categorization/categorize"

// A single recorded period of attention on one page.
export interface Visit {
  id: number
  domain: string
  title: string
  url: string
  startTs: number
  endTs: number
  duration: number // milliseconds
  category: Category
  favIconUrl?: string // captured from the tab when available
  sessionId?: number // assigned in Phase 4
}

// A group of consecutive visits (Phase 4). Declared now so the schema is
// stable; populated later.
export interface Session {
  id: number
  label: string
  startTs: number
  endTs: number
  category?: Category
}

// Single source of truth shared by the background worker and the UI.
export const db = new Dexie("BrowserScreenTimeDB") as Dexie & {
  visits: EntityTable<Visit, "id">
  sessions: EntityTable<Session, "id">
}

db.version(1).stores({
  visits: "++id, startTs, domain, category, sessionId",
  sessions: "++id, startTs, category",
})

// The DB was named "WebTimelineDB" before the rename to Browser Screen Time.
// IndexedDB keys storage by name, so a rename would otherwise orphan existing
// local data. Copy the legacy DB's rows into the new one once, then drop it.
// Idempotent: only runs while the legacy DB exists and the new one is empty.
const LEGACY_DB_NAME = "WebTimelineDB"

export async function migrateLegacyDatabase(): Promise<void> {
  if (!(await Dexie.exists(LEGACY_DB_NAME))) return
  if ((await db.visits.count()) > 0 || (await db.sessions.count()) > 0) {
    // New DB already has data — assume migration ran (or the user started
    // fresh); just clear the orphan so it can't run again.
    await Dexie.delete(LEGACY_DB_NAME)
    return
  }

  const legacy = new Dexie(LEGACY_DB_NAME) as Dexie & {
    visits: EntityTable<Visit, "id">
    sessions: EntityTable<Session, "id">
  }
  legacy.version(1).stores({
    visits: "++id, startTs, domain, category, sessionId",
    sessions: "++id, startTs, category",
  })

  try {
    const [visits, sessions] = await Promise.all([
      legacy.visits.toArray(),
      legacy.sessions.toArray(),
    ])
    if (visits.length > 0) await db.visits.bulkPut(visits)
    if (sessions.length > 0) await db.sessions.bulkPut(sessions)
  } finally {
    legacy.close()
  }

  await Dexie.delete(LEGACY_DB_NAME)
}
