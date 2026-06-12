# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Browser Screen Time is a privacy-first Chromium MV3 extension that tracks browsing
activity locally, categorizes sites, reconstructs sessions, and renders a
timeline + analytics dashboard. It ships a **fully local, offline MVP** — there
is **no cloud and no AI yet**. Most of `README.md` describes the long-term
product vision; only the "Implemented (Local MVP)" section reflects what exists.

## Commands

```bash
pnpm dev         # vite dev server with crxjs HMR for the extension pages
pnpm build       # tsc -b (type-check) then vite build → dist/
pnpm test        # vitest run (the pure logic suite)
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm format      # prettier --write on ts/tsx
pnpm icons       # regenerate icons from assets/icon/icon.svg
```

Run a single test file or test by name:

```bash
pnpm vitest run src/lib/analytics/sessions.test.ts
pnpm vitest run -t "buildSessions splits on idle gap"
```

To load the extension: `pnpm build`, then `chrome://extensions` → Developer
mode → Load unpacked → select `dist/`.

## Architecture & data flow

The pipeline is **raw browser events → visits (IndexedDB) → sessions/metrics →
reactive UI**. Two runtime contexts share one Dexie database:

1. **Background service worker** (`src/background/`) — the only writer of raw
   data. `index.ts` registers all `chrome.*` listeners *synchronously at the top
   level* (required so an evicted MV3 worker re-wakes per event). `tracker.ts`
   reconciles "what tab is actually in front" against the recorded open visit:
   it opens a `Visit` row immediately (endTs === startTs, so a crash still
   leaves a record), extends it on periodic alarm `checkpoint`s, and finalizes
   duration on `closeVisit` (dropping visits under `MIN_DURATION_MS`). Accrual
   `pause`/`resume` is driven by window-focus and idle events.

2. **State across worker evictions** (`src/background/state.ts`) — the
   "currently open visit" and paused flag **cannot live in module variables**
   (the worker is evicted between events). They persist to
   `chrome.storage.session` (memory-only, never hits disk — intentional for
   privacy).

3. **Dexie DB** (`src/lib/db/`) — `db.ts` is the single source of truth
   (`visits`, `sessions` stores). `repository.ts` holds all query helpers
   (`getVisitsForDay`, `timePerCategory`, etc.). The UI reads reactively via
   `useLiveQuery` (see `src/dashboard/use-today.ts`), so writes from the worker
   update the dashboard live with no message passing.

4. **Pure logic** (`src/lib/analytics/`, `src/lib/categorization/`) — framework-
   and DB-free, and the only code with unit tests. `sessions.ts` groups visits
   into sessions (split on idle gap > `SESSION_IDLE_GAP_MS`, 30 min) and derives
   `SessionStats`; `metrics.ts` computes focus score, deep-work detection, and
   context-switching. `persist.ts` is the thin IndexedDB-facing wrapper that
   calls `buildSessions` and writes results back (replace day's sessions +
   backfill each visit's `sessionId`). Keep DB access out of `sessions.ts`/
   `metrics.ts` — that separation is what keeps them testable.

5. **Dashboard** (`src/dashboard/`) — a standalone extension page (not in the
   manifest; wired as a separate Vite rollup input in `vite.config.ts`). Uses
   **hash routing** (`createHashRouter`) because it's served from a static
   `chrome-extension://` file with no server. Pages: Dashboard, Timeline,
   Analytics, Insights (placeholder). `popup/` and `options/` are separate
   entry points.

## Conventions

- **Path alias**: `@/` → `src/` (configured in `vite.config.ts`,
  `vitest.config.ts`, and tsconfig).
- **Categories** are a fixed `as const` tuple in `categorize.ts`. `categorize()`
  maps a registrable domain via `rules.ts`, falling back to `"Uncategorized"` —
  this is the intentional **AI-fallback seam** (don't replace it with a stub
  that breaks the offline build). Domain extraction (`domain.ts`) is a
  lightweight heuristic, not a full Public Suffix List.
- **Tests** live next to source as `*.test.ts` and cover only pure logic;
  vitest runs in a `node` environment with no crx plugin.
- **Prettier**: no semicolons, double quotes, 2-space, 80 cols, `es5` trailing
  commas. Tailwind classes are auto-sorted; `cn`/`cva` are registered as
  Tailwind functions.
- **UI**: Tailwind v4 + shadcn/ui (style `radix-vega`, hugeicons). **Always
  prefer a shadcn/ui component over building one from scratch.** Reach for the
  primitives already in `src/components/ui/` (`badge`, `button`, `card`,
  `input`, `select`) first. If the component you need isn't there, add it with
  the CLI rather than hand-rolling it:

  ```bash
  pnpm dlx shadcn@latest add <component>   # e.g. dialog, tabs, dropdown-menu
  ```

  It lands in `src/components/ui/`. **Do not modify the generated files in
  `src/components/ui/` unless explicitly told to** — treat them as vendored
  upstream code. Compose and extend them from outside instead (wrapper
  components, `className` overrides, `cva` variants in your own files). Only
  write a bespoke component when shadcn has no equivalent (e.g. domain-specific
  charts built on Recharts).

## Manifest

`manifest.config.ts` is the MV3 manifest (crxjs reads the html/ts entry points
and rewrites them at build time). Permissions: `tabs`, `idle`, `storage`,
`alarms`. Idle detection is 60s; the flush alarm (`wt:flush`) fires every minute
to checkpoint the open visit and rebuild the day's sessions.
