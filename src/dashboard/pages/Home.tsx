import { Analytics } from "./Analytics"
import { Dashboard } from "./Dashboard"
import { Timeline } from "./Timeline"

// The dashboard is a single full-width screen. The KPI strip spans the top;
// below it, the timeline (the "see everything" element) takes the main column
// and the analytics charts sit in a rail beside it.
export function Home() {
  return (
    <div className="flex flex-col gap-8">
      <Dashboard />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="flex flex-col gap-3 xl:col-span-7">
          <h2 className="text-sm font-medium text-muted-foreground">
            Timeline
          </h2>
          <Timeline />
        </section>

        <aside className="flex flex-col gap-3 xl:col-span-5">
          <h2 className="text-sm font-medium text-muted-foreground">
            Analytics
          </h2>
          <Analytics />
        </aside>
      </div>
    </div>
  )
}
