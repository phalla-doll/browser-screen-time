import { Button } from "@/components/ui/button"

// Dashboard shell. Router + pages (Dashboard, Timeline, Analytics, Insights)
// land in Phase 5; this is the placeholder the dashboard page mounts.
export function App() {
  return (
    <div className="min-h-svh bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <header>
          <h1 className="text-xl font-medium">WebTimeline</h1>
          <p className="text-sm text-muted-foreground">
            Privacy-first browsing timeline & analytics — all local, no cloud.
          </p>
        </header>
        <p className="text-sm text-muted-foreground">
          The dashboard is scaffolded. Cards, timeline, and charts arrive in
          Phases 5–6.
        </p>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
        <div>
          <Button>Button</Button>
        </div>
      </div>
    </div>
  )
}

export default App
