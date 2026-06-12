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
export const db = new Dexie("WebTimelineDB") as Dexie & {
  visits: EntityTable<Visit, "id">
  sessions: EntityTable<Session, "id">
}

db.version(1).stores({
  visits: "++id, startTs, domain, category, sessionId",
  sessions: "++id, startTs, category",
})
