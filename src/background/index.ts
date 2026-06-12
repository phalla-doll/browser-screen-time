// WebTimeline background service worker.
//
// Phase 0: minimal stub so the MV3 worker loads. Activity tracking
// (tabs / windows / idle listeners, current-visit accrual) lands in Phase 1.

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[WebTimeline] installed:", details.reason)
})

console.log("[WebTimeline] background service worker booted")
