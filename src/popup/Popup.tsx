import { Button } from "@/components/ui/button"

const DASHBOARD_PAGE = "src/dashboard/index.html"

export function Popup() {
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL(DASHBOARD_PAGE) })
  }

  return (
    <div className="w-72 bg-background p-4 text-foreground">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-sm font-medium">WebTimeline</h1>
          <p className="text-xs text-muted-foreground">
            Local activity tracking is running. Stats arrive in a later phase.
          </p>
        </div>
        <Button size="sm" className="w-full" onClick={openDashboard}>
          Open dashboard
        </Button>
      </div>
    </div>
  )
}
