export function Options() {
  return (
    <div className="min-h-svh bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-md flex-col gap-2">
        <h1 className="text-lg font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">
          WebTimeline keeps all data on this device. Configurable options
          (categories, idle thresholds, data export) arrive in a later phase.
        </p>
      </div>
    </div>
  )
}
