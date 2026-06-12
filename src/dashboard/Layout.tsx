import { NavLink, Outlet } from "react-router-dom"

import { cn } from "@/lib/utils"

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/timeline", label: "Timeline", end: false },
  { to: "/analytics", label: "Analytics", end: false },
  { to: "/insights", label: "Insights", end: false },
]

export function Layout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4">
          <div>
            <h1 className="text-lg font-medium">WebTimeline</h1>
            <p className="text-xs text-muted-foreground">
              Privacy-first browsing timeline & analytics — all local.
            </p>
          </div>
          <nav className="flex gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
