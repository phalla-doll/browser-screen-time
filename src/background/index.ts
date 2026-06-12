// WebTimeline background service worker.
//
// Captures raw browsing activity and persists it as "visits" (Phase 1) using
// the shared Dexie store + categorization (Phases 2–3). Listeners are
// registered synchronously at the top level so an evicted worker re-wakes for
// each event.

import { rebuildSessionsForDay } from "@/lib/analytics/persist"

import { checkpoint, pause, resume, syncActiveTab } from "./tracker"

const FLUSH_ALARM = "wt:flush"
const IDLE_DETECTION_SECONDS = 60

const now = () => Date.now()

// Treat the user as away after 60s of no input; pairs with the focus listener.
chrome.idle.setDetectionInterval(IDLE_DETECTION_SECONDS)

function ensureFlushAlarm() {
  chrome.alarms.create(FLUSH_ALARM, { periodInMinutes: 1 })
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[WebTimeline] installed:", details.reason)
  ensureFlushAlarm()
  void syncActiveTab(now())
})

chrome.runtime.onStartup.addListener(() => {
  ensureFlushAlarm()
  void syncActiveTab(now())
})

// Active tab changed within a window.
chrome.tabs.onActivated.addListener(() => {
  void syncActiveTab(now())
})

// Navigation, title, or load-state changes on a tab.
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.title || changeInfo.status === "complete") {
    void syncActiveTab(now())
  }
})

// A tab closing may surface a different active tab.
chrome.tabs.onRemoved.addListener(() => {
  void syncActiveTab(now())
})

// Window focus: WINDOW_ID_NONE means everything is in the background (or the
// OS focus left Chrome) — pause; otherwise resume on the newly focused window.
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    void pause(now())
  } else {
    void resume(now())
  }
})

// Idle / locked → pause accrual; active → resume.
chrome.idle.onStateChanged.addListener((state) => {
  if (state === "active") {
    void resume(now())
  } else {
    void pause(now())
  }
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === FLUSH_ALARM) {
    void checkpoint(now()).then(() => rebuildSessionsForDay(new Date()))
  }
})

// Cold-start safety: attach to the foreground tab when the worker first boots.
ensureFlushAlarm()
void syncActiveTab(now())

console.log("[WebTimeline] background service worker booted")
