import { categorize } from "@/lib/categorization/categorize"
import { getRegistrableDomain } from "@/lib/categorization/domain"
import type { Visit } from "@/lib/db/db"
import { addVisit, deleteVisit, updateVisit } from "@/lib/db/repository"

import {
  getActiveVisit,
  isPaused,
  setActiveVisit,
  setPaused,
} from "./state"

// Visits shorter than this are treated as fly-through navigation and discarded.
const MIN_DURATION_MS = 1000

function isTrackable(url: string | undefined): url is string {
  return (
    typeof url === "string" &&
    (url.startsWith("http://") || url.startsWith("https://"))
  )
}

// Insert a fresh row for the page and mark it as the active visit. The row is
// written immediately (endTs === startTs) so an unexpected worker death or
// browser crash still leaves a record; subsequent checkpoints extend it.
async function openVisit(
  url: string,
  title: string | undefined,
  favIconUrl: string | undefined,
  now: number
): Promise<void> {
  const domain = getRegistrableDomain(url)
  if (!domain) {
    return
  }
  const id = await addVisit({
    domain,
    title: title?.trim() || domain,
    url,
    startTs: now,
    endTs: now,
    duration: 0,
    category: categorize(domain),
    favIconUrl: favIconUrl?.trim() || undefined,
  })
  await setActiveVisit({ id, domain, url, startTs: now })
}

// Finalize the active visit: persist its real duration, or drop it if it was
// too short to matter.
async function closeVisit(now: number): Promise<void> {
  const active = await getActiveVisit()
  if (!active) {
    return
  }
  const duration = now - active.startTs
  if (duration < MIN_DURATION_MS) {
    await deleteVisit(active.id)
  } else {
    await updateVisit(active.id, { endTs: now, duration })
  }
  await setActiveVisit(null)
}

// Reconcile our recorded state with whatever tab is actually in front.
async function handleTab(
  tab: chrome.tabs.Tab | undefined,
  now: number
): Promise<void> {
  const active = await getActiveVisit()

  if (!tab || !isTrackable(tab.url)) {
    await closeVisit(now)
    return
  }

  // Same page still in front — just keep the title and favicon fresh (both
  // often arrive after the initial navigation event).
  if (active && active.url === tab.url) {
    const changes: Partial<Visit> = {}
    if (tab.title?.trim()) {
      changes.title = tab.title.trim()
    }
    if (tab.favIconUrl?.trim()) {
      changes.favIconUrl = tab.favIconUrl.trim()
    }
    if (Object.keys(changes).length > 0) {
      await updateVisit(active.id, changes)
    }
    return
  }

  await closeVisit(now)
  await openVisit(tab.url, tab.title, tab.favIconUrl, now)
}

// Query the focused window's active tab and reconcile against it. No-op while
// paused (idle or all windows unfocused).
export async function syncActiveTab(now: number): Promise<void> {
  if (await isPaused()) {
    return
  }
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })
  await handleTab(tab, now)
}

// Stop accruing time: close the open visit and latch the paused flag.
export async function pause(now: number): Promise<void> {
  await setPaused(true)
  await closeVisit(now)
}

// Resume accrual and immediately attach to the current foreground tab.
export async function resume(now: number): Promise<void> {
  await setPaused(false)
  await syncActiveTab(now)
}

// Periodic safety flush (driven by chrome.alarms): extend the open visit's
// duration so a long-lived page survives an unexpected shutdown.
export async function checkpoint(now: number): Promise<void> {
  if (await isPaused()) {
    return
  }
  const active = await getActiveVisit()
  if (!active) {
    return
  }
  await updateVisit(active.id, { endTs: now, duration: now - active.startTs })
}
