import { defineManifest } from "@crxjs/vite-plugin"

import pkg from "./package.json"

// MV3 manifest. crxjs reads the html/ts entry points referenced here and
// rewrites them to the built asset paths at bundle time.
export default defineManifest({
  manifest_version: 3,
  name: "WebTimeline",
  version: pkg.version,
  description:
    "Privacy-first browsing activity timeline, categorization & analytics. Local-only, no cloud.",
  permissions: ["tabs", "idle", "storage", "alarms"],
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  action: {
    default_popup: "src/popup/index.html",
    default_title: "WebTimeline",
  },
  options_page: "src/options/index.html",
})
