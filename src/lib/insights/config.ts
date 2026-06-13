// User-controlled AI Insights settings, persisted to chrome.storage.local. The
// API key lives on-device only; it is sent to NVIDIA solely as the request's
// Authorization header when the user generates insights.
export interface InsightsConfig {
  apiKey: string
  model: string
  baseUrl: string
}

const STORAGE_KEY = "insightsConfig"

export const DEFAULT_CONFIG: InsightsConfig = {
  apiKey: "",
  model: "openai/gpt-oss-120b",
  baseUrl: "https://integrate.api.nvidia.com/v1",
}

export async function loadConfig(): Promise<InsightsConfig> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  return {
    ...DEFAULT_CONFIG,
    ...(stored[STORAGE_KEY] as Partial<InsightsConfig>),
  }
}

export async function saveConfig(
  patch: Partial<InsightsConfig>
): Promise<InsightsConfig> {
  const next = { ...(await loadConfig()), ...patch }
  await chrome.storage.local.set({ [STORAGE_KEY]: next })
  return next
}
