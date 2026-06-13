import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DEFAULT_CONFIG, loadConfig, saveConfig } from "@/lib/insights/config"

export function Options() {
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState(DEFAULT_CONFIG.model)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadConfig().then((config) => {
      setApiKey(config.apiKey)
      setModel(config.model)
    })
  }, [])

  async function handleSave() {
    await saveConfig({ apiKey: apiKey.trim(), model: model.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-svh bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-medium">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Browser Screen Time keeps all tracking data on this device.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Insights</CardTitle>
            <CardDescription>
              Generate insights with the NVIDIA-hosted model. Your API key is
              stored only on this device and sent to NVIDIA solely to authorize
              each request. Generating insights sends a summary of the day's
              browsing (categories and top domains — never full URLs)
              off-device.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">NVIDIA API key</span>
              <Input
                type="password"
                placeholder="nvapi-…"
                value={apiKey}
                autoComplete="off"
                onChange={(e) => setApiKey(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Model</span>
              <Input value={model} onChange={(e) => setModel(e.target.value)} />
            </label>
            <div className="flex items-center gap-3">
              <Button onClick={handleSave}>Save</Button>
              {saved && (
                <span className="text-sm text-muted-foreground">Saved.</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
