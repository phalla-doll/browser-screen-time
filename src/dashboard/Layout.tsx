import { Outlet } from "react-router-dom"

export function Layout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-[96rem] px-8 py-4">
          <h1 className="text-lg font-medium">WebTimeline</h1>
          <p className="text-xs text-muted-foreground">
            Privacy-first browsing timeline & analytics — all local.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-[96rem] px-8 py-6">
        <Outlet />
      </main>
    </div>
  )
}
