# WebTimeline

Apple Screen Time for Browsing + Timeline + AI Insights

## Overview

WebTimeline is a privacy-first Chromium browser extension that automatically tracks browsing activity, categorizes websites, reconstructs browsing sessions, generates timeline reports, and provides AI-powered insights about online behavior.

Unlike traditional screen-time trackers that only measure time spent, WebTimeline visualizes how users move across the web.

Example:

09:00 → GitHub
09:15 → ChatGPT
09:25 → Angular Docs
09:45 → GitHub
10:00 → YouTube

Users can replay their browsing history, understand work patterns, identify distractions, and discover productivity trends.

---

## Project Status

WebTimeline currently ships a **fully local, offline MVP**: activity tracking → local storage → categorization → session reconstruction → a dashboard with timeline and analytics. There is **no cloud and no AI yet** — those remain planned (see [Planned (deferred)](#planned-deferred)).

Most of this document describes the long-term product vision. The sections below describe what is actually implemented today.

### Implemented (Local MVP)

- **Activity tracking** — a background service worker records per-page *visits* from tab, window-focus, and idle events; accrual pauses on idle/blur and resumes on focus.
- **Local storage** — IndexedDB via Dexie; a single store shared by the worker and the UI, reactive through `useLiveQuery`.
- **Categorization** — registrable-domain → category rules across the 8 built-in categories below; unknown domains fall back to *Uncategorized* (AI fallback is a stubbed seam).
- **Sessions & metrics** — visits grouped into sessions (split on idle gaps > 30 min); focus score, deep-work detection, and context-switching stats — all unit-tested.
- **Dashboard** — cards for Total Time, Focus Score, Deep Work, Top Category, and Most Visited Site.
- **Timeline** — visits grouped by hour with category chips, plus search and category filters.
- **Analytics** — Recharts: category donut, hourly-activity bar, 7-day daily-total bar, focus-score trend line, and a daily report.

### Planned (deferred)

AI categorization/insights/recommendations, Cloudflare Workers + Hono backend, cloud & multi-device sync, Flow Graph (React Flow / D3), weekly/monthly comparison reports, browser replay, team analytics, and monetization tiers. The **Insights** page is a placeholder today.

---

## Getting Started

Prerequisites: Node.js and [pnpm](https://pnpm.io).

```bash
pnpm install     # install dependencies
pnpm build       # type-check + bundle the extension to dist/
pnpm dev         # vite dev server with HMR
pnpm test        # run the vitest suite
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm icons       # regenerate icons from assets/icon/icon.svg
```

### Load the extension

1. Run `pnpm build`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` folder.
4. Browse a few sites, open the dashboard from the toolbar popup, and watch the cards, timeline, and charts update live.

---

## Architecture

- **`manifest.config.ts`** — MV3 manifest (permissions: `tabs`, `idle`, `storage`, `alarms`).
- **`src/background/`** — service worker: activity tracking, visit accrual, periodic flush.
- **`src/lib/db/`** — Dexie schema + repository (single source of truth).
- **`src/lib/categorization/`** — domain extraction, rules, and `categorize()`.
- **`src/lib/analytics/`** — pure session reconstruction and productivity metrics.
- **`src/dashboard/`** — extension page: hash router across Dashboard, Timeline, Analytics, Insights.
- **`src/popup/`**, **`src/options/`** — toolbar popup and settings page.

Built with **Vite + `@crxjs/vite-plugin`** (MV3), **React 19**, **TypeScript**, **Tailwind v4**, **shadcn/ui**, **Dexie**, and **Recharts**.

---

# Core Features

## Activity Tracking

Track:

- Active tab changes
- Browser focus/unfocus
- Window minimize/restore
- User idle state
- Navigation events
- Tab creation/closure

Example:

{
  "timestamp": "2026-06-11T09:15:32Z",
  "domain": "chatgpt.com",
  "title": "Angular Optimization",
  "duration": 420,
  "category": "AI"
}

---

## Timeline View

Display browsing activity chronologically.

Example:

09:00 GitHub
09:15 ChatGPT
09:25 Angular.dev
09:45 GitHub
10:00 Gmail
10:10 YouTube

Capabilities:

- Zoom by hour/day/week
- Search timeline
- Filter categories
- Jump to specific session
- Export timeline

---

## Session Reconstruction

Automatically group related browsing actions into sessions.

Example:

Development Session

09:00 → 11:30

GitHub
↓
ChatGPT
↓
Angular.dev
↓
Stack Overflow
↓
GitHub

Session Statistics:

- Duration
- Sites visited
- Category breakdown
- Focus score

---

## Flow Graph

Visualize browsing paths.

Example:

GitHub
 ↓
ChatGPT
 ↓
Angular Docs
 ↓
GitHub

Advanced Example:

GitHub
├─ ChatGPT
│   ├─ Angular Docs
│   └─ MDN
└─ Stack Overflow

Metrics:

- Most common transitions
- Most repeated workflows
- Time between transitions

---

## Website Categorization

### Built-In Categories

Development

- GitHub
- GitLab
- Bitbucket

AI

- ChatGPT
- Claude
- Gemini
- Z AI

Documentation

- MDN
- Angular
- React
- Next.js

Communication

- Gmail
- Slack
- Discord
- Telegram

Social

- Facebook
- X
- LinkedIn

Entertainment

- YouTube
- Netflix
- Twitch

Shopping

- Amazon
- Lazada
- Shopee

News

- CNN
- BBC
- Reuters

---

## AI Categorization

For unknown domains:

Input:

random-angular-blog.com

AI Output:

{
  "category": "Development",
  "confidence": 0.93
}

Provider:

- NVIDIA API
- OpenAI
- Claude

Configurable

---

# Reports

## Daily Report

Example

Date:
June 11, 2026

Total Browsing:
8h 24m

Categories:

Development 4h 10m
AI 2h 05m
Communication 45m
Entertainment 1h 24m

Top Websites:

1. GitHub
2. ChatGPT
3. Angular.dev
4. Gmail
5. YouTube

---

## Weekly Report

Example

Week 24

Total Time:
42h

Most Productive Day:
Tuesday

Top Category:
Development

Top Website:
GitHub

Focus Score:
84%

Average Session:
58m

Distraction Count:
17

---

## Monthly Report

Example

May vs June

Development:
+18%

AI:
+62%

Social:
-21%

Entertainment:
-13%

Most Improved Month:
June

---

# Productivity Metrics

## Focus Score

Formula

Focused Time
-------------
Total Time

Example

Focused Time:
6h

Total Time:
8h

Focus Score:
75%

---

## Deep Work Sessions

Detect uninterrupted work periods.

Criteria:

- Minimum 30 minutes
- Limited tab switching
- Development/AI categories

Example:

Deep Work Session

09:00 → 11:12

Duration:
2h 12m

---

## Context Switching

Track frequency of tab changes.

Example:

Today

Total Switches:
184

Average Gap:
4m

Most Common Switch:

GitHub
↔
ChatGPT

---

# AI Insights

Examples:

"You spend most productive time between 8AM and 11AM."

"You visit GitHub after ChatGPT 78% of the time."

"YouTube usage decreased by 22% this week."

"You had 4 deep work sessions today."

"Wednesday is consistently your most productive day."

---

# Smart Recommendations

Examples:

Try scheduling focused work between 8AM and 11AM.

You switched between GitHub and ChatGPT 92 times.
Consider using split-screen.

Your average YouTube session increased by 45%.

You spent 12 hours reading documentation this week.

---

# Dashboard Pages

## Dashboard

Cards:

- Total Time
- Focus Score
- Deep Work Hours
- Top Category
- Most Visited Site

---

## Timeline

Views:

- Hourly
- Daily
- Weekly
- Monthly

Filters:

- Website
- Category
- Session
- Search

---

## Analytics

Charts:

- Category Pie Chart
- Daily Activity Graph
- Weekly Trend
- Monthly Trend
- Focus Score Trend

---

## Flow Graph

Interactive graph:

GitHub
 ↓
ChatGPT
 ↓
Angular Docs

Zoomable

Searchable

---

## Insights

AI-generated recommendations.

Daily summary.

Weekly summary.

Monthly summary.

---

# Privacy

Default:

✓ Local-first

✓ No cloud required

✓ No browsing history uploaded

✓ User owns all data

✓ Export anytime

Optional:

✓ Cloud sync

✓ Multi-device sync

✓ AI insights

---

# Tech Stack

## Browser Extension

- Vite + @crxjs/vite-plugin (MV3)
- React
- TypeScript
- TailwindCSS
- shadcn/ui

---

## Storage

Local:

- IndexedDB
- Dexie

Optional Cloud:

- Cloudflare D1
- Cloudflare KV
- Cloudflare R2

---

## Backend

- Cloudflare Workers
- Hono

---

## Analytics

- Recharts
- D3.js (planned)
- React Flow (planned)

---

## AI

Primary:

- NVIDIA API

Optional:

- OpenAI
- Claude

Tasks:

- Categorization
- Insights
- Recommendations
- Session labeling

---

# Future Features

## Team Analytics

For companies.

Compare productivity trends.

Anonymous aggregation.

---

## Browser Replay

Replay browsing history.

Example:

09:00 GitHub
09:15 ChatGPT
09:25 Angular Docs

Play as timeline.

---

## Life Dashboard

Combine:

- Browser activity
- Calendar
- Tasks
- Notes

Single productivity dashboard.

---

# Monetization

Free

- Tracking
- Timeline
- Reports
- Analytics

Pro ($4.99/month)

- Cloud Sync
- AI Insights
- Unlimited History
- Advanced Reports
- Productivity Coaching

Team ($8/user/month)

- Team Analytics
- Productivity Reports
- Benchmarks

---

# Vision

WebTimeline helps users understand not just how much time they spend online, but how they navigate the web, how they work, and where their attention goes.

Think:

Apple Screen Time
+
Git Analytics
+
ActivityWatch
+
AI Productivity Coach

for the browser.
