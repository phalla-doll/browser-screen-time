# Browser Screen Time — Local MVP Implementation Plan

## Context

The repo (`browser-screen-time`) currently holds a fresh **Vite + React 19 + TypeScript + Tailwind v4 + shadcn** SPA scaffold — only `src/App.tsx`, a `ThemeProvider`, a `Button`, and standard config. The `README.md` specifies a far larger product: a privacy-first Chromium extension that tracks browsing, categorizes sites, reconstructs sessions, renders timelines/analytics, and adds AI + a Cloudflare backend.

This plan delivers the **Local MVP**: a fully working, offline, privacy-first extension — activity tracking → local storage → categorization → session reconstruction → dashboard/timeline/analytics. **No cloud, no AI** (those are explicitly deferred to later phases). Each phase is independently shippable.

**Stack decision:** Build on **Vite + `@crxjs/vite-plugin`** (not Plasmo). It produces a valid MV3 extension while preserving the existing React 19 / Tailwind v4 / shadcn / path-alias setup, all of which we keep and reuse.

---

## Phase 0 — Extension foundation

Turn the SPA into a loadable MV3 extension.

- Add deps: `@crxjs/vite-plugin`, `dexie`, `dexie-react-hooks`. Add `recharts` (Phase 6) and `react-router-dom` (Phase 5) when those phases land.
- Create `manifest.config.ts` (MV3): `permissions: ["tabs", "idle", "storage", "alarms"]`, background service worker (`src/background/index.ts`, `type: module`), `action` default popup (`src/popup/index.html`), and an extension page for the dashboard (`src/dashboard/index.html`).
- Update `vite.config.ts`: add `crx({ manifest })` plugin alongside existing `react()` + `tailwindcss()`. Keep the `@` alias.
- Scaffold three HTML entry points, each mounting React + reusing the existing `ThemeProvider` (`src/components/theme-provider.tsx`) and `src/index.css`:
  - `src/popup/` — quick stats (small).
  - `src/dashboard/` — main app (repurpose current `App.tsx`).
  - `src/options/` — settings (optional this phase).
- **Verify:** `pnpm build` → load unpacked `dist/` at `chrome://extensions` → popup opens, dashboard page renders, dark-mode toggle works.

## Phase 1 — Activity tracking (background service worker)

Capture raw activity in `src/background/`.

- Listen to: `chrome.tabs.onActivated`, `chrome.tabs.onUpdated` (URL/title changes), `chrome.windows.onFocusChanged` (focus/blur, minimize→`WINDOW_ID_NONE`), `chrome.idle.onStateChanged` (set detection interval ~60s), `chrome.tabs.onRemoved`/`onCreated`.
- Maintain a single "current active visit" `{ domain, title, url, startTs }`. On any transition (tab switch, focus loss, idle, navigation), close the open visit, compute `duration`, persist it, and open the next.
- Pause accrual when the window is unfocused or state is `idle`/`locked`; resume on active focus.
- MV3 workers sleep — persist current-visit state to `chrome.storage.session` so it survives suspension; use `chrome.alarms` for periodic flush.
- **Verify:** Browse several tabs; in the service-worker DevTools console confirm visits open/close with sane durations and idle pauses accrual.

## Phase 2 — Storage & data model (Dexie / IndexedDB)

`src/lib/db/` — single source of truth, shared by background + UI.

- Define Dexie schema (`db.ts`):
  - `visits`: `++id, domain, title, url, startTs, endTs, duration, category, sessionId` (indexes on `startTs`, `domain`, `category`, `sessionId`).
  - `sessions`: `++id, label, startTs, endTs, category` (populated in Phase 4).
- Repository helpers (`repository.ts`): `addVisit`, `getVisitsBetween(from, to)`, `getVisitsForDay(date)`, aggregation queries (time per domain, time per category).
- Background writes via repository; UI reads via `dexie-react-hooks` `useLiveQuery` for reactive updates.
- **Verify:** Browse, then inspect IndexedDB in DevTools — visit rows present with correct fields.

## Phase 3 — Website categorization

`src/lib/categorization/`.

- `domain.ts`: extract registrable domain from a URL.
- `rules.ts`: built-in domain→category map seeded from README (Development, AI, Documentation, Communication, Social, Entertainment, Shopping, News).
- `categorize(domain)`: rule lookup → category or `"Uncategorized"` (AI fallback is a later phase, leave a clearly-marked seam).
- Background sets `category` on each visit at write time.
- **Verify:** Visits to github.com/youtube.com/etc. carry the correct category in IndexedDB.

## Phase 4 — Sessions & productivity metrics

Pure, unit-testable functions over visits (`src/lib/analytics/`).

- `sessions.ts`: group consecutive visits into sessions, splitting on idle gaps > threshold (~30 min). Compute per-session duration, sites visited, category breakdown, focus score. Persist to `sessions` table; backfill `sessionId` on visits.
- `metrics.ts`:
  - **Focus Score** = focused time / total time (focused = Development/AI/Documentation categories).
  - **Deep Work** = sessions ≥ 30 min, limited tab switching, in focus categories.
  - **Context switching** = tab-change count, average gap, most common transition pair.
- **Verify:** Lightweight tests (or a dev harness) over fixture visit arrays produce expected sessions/scores.

## Phase 5 — Dashboard UI

`src/dashboard/` — main extension page.

- Add `react-router-dom`; nav across pages: **Dashboard**, **Timeline**, **Analytics**, **Insights** (Insights a placeholder this MVP).
- Pull shadcn components as needed via the configured CLI (`card`, `tabs`, `badge`, `scroll-area`, `select`) — `components.json` already set to `radix-vega`/`hugeicons`; reuse existing `Button` and `cn` (`src/lib/utils.ts`).
- **Dashboard page:** cards for Total Time, Focus Score, Deep Work Hours, Top Category, Most Visited Site (from `useLiveQuery` aggregations).
- **Timeline page:** chronological visit list grouped by hour/day with category color chips; filters (website, category, search); day/week zoom.
- All data via `useLiveQuery` so it updates live as the background records.
- **Verify:** Browse in one window, open dashboard in another — cards and timeline reflect activity within seconds.

## Phase 6 — Analytics charts

`src/dashboard/` Analytics page with **Recharts**.

- Category pie chart, daily activity bar graph, weekly trend, focus-score trend — fed by Phase 2 aggregations + Phase 4 metrics.
- Daily report summary (total browsing, category breakdown, top 5 sites) matching README layout.
- **Verify:** Charts render against real recorded data and match the dashboard card numbers.

---

## Explicitly deferred (post-MVP, future plans)

AI categorization/insights/recommendations (NVIDIA/OpenAI/Claude), Cloudflare Workers + Hono backend, cloud/multi-device sync, Flow Graph (React Flow / D3), weekly & monthly comparison reports, browser replay, team analytics, monetization tiers.

## Files touched (representative)

- New: `manifest.config.ts`, `src/background/index.ts`, `src/popup/`, `src/dashboard/`, `src/options/`, `src/lib/db/{db,repository}.ts`, `src/lib/categorization/{domain,rules,categorize}.ts`, `src/lib/analytics/{sessions,metrics}.ts`.
- Modified: `vite.config.ts` (add crx plugin), `package.json` (deps), `src/App.tsx` (→ dashboard shell).
- Reused as-is: `src/components/theme-provider.tsx`, `src/components/ui/button.tsx`, `src/lib/utils.ts`, `src/index.css`, `components.json`, path alias `@`.

## End-to-end verification

After each phase: `pnpm build`, load unpacked `dist/` at `chrome://extensions`, browse a set of known sites, and confirm — service-worker logs (Phase 1), IndexedDB rows (Phase 2–3), correct sessions/metrics (Phase 4), live dashboard cards + timeline (Phase 5), and charts (Phase 6). Run `pnpm typecheck` and `pnpm lint` throughout.
