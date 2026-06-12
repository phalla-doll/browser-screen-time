// MV3 service workers are evicted between events, so the "currently open
// visit" cannot live in a module variable — it is persisted to
// chrome.storage.session (cleared when the browser closes, never written to
// disk, which suits a privacy-first tool).

const ACTIVE_VISIT_KEY = "wt:activeVisit"
const PAUSED_KEY = "wt:paused"

// The in-flight visit: a row already inserted in IndexedDB (id), kept open so
// we can update its endTs/duration as time passes and finalize it on close.
export interface ActiveVisit {
  id: number
  domain: string
  url: string
  startTs: number
}

export async function getActiveVisit(): Promise<ActiveVisit | null> {
  const stored = await chrome.storage.session.get(ACTIVE_VISIT_KEY)
  return (stored[ACTIVE_VISIT_KEY] as ActiveVisit | undefined) ?? null
}

export async function setActiveVisit(visit: ActiveVisit | null): Promise<void> {
  if (visit === null) {
    await chrome.storage.session.remove(ACTIVE_VISIT_KEY)
    return
  }
  await chrome.storage.session.set({ [ACTIVE_VISIT_KEY]: visit })
}

export async function isPaused(): Promise<boolean> {
  const stored = await chrome.storage.session.get(PAUSED_KEY)
  return Boolean(stored[PAUSED_KEY])
}

export async function setPaused(paused: boolean): Promise<void> {
  await chrome.storage.session.set({ [PAUSED_KEY]: paused })
}
