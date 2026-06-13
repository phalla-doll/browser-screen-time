import type { Visit } from "@/lib/db/db"

import { loadConfig } from "./config"
import { buildInsightContext } from "./context"
import { parseInsights } from "./parse"
import { buildMessages } from "./prompt"
import { chatCompletion } from "./provider"
import type { Insight } from "./types"

// End-to-end seam the UI calls: summarize the day -> prompt -> NVIDIA -> parse.
// The pure steps (context, prompt, parse) are unit-tested in isolation; only
// the provider call touches the network.
export async function generateInsights(visits: Visit[]): Promise<Insight[]> {
  if (visits.length === 0) {
    throw new Error("No browsing recorded yet today.")
  }

  const config = await loadConfig()
  if (!config.apiKey) {
    throw new Error(
      "Add your NVIDIA API key in the extension Settings to generate insights."
    )
  }

  const messages = buildMessages(buildInsightContext(visits))
  return parseInsights(await chatCompletion(messages, config))
}
