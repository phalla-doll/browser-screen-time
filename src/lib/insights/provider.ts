import type { InsightsConfig } from "./config"
import type { ChatMessage } from "./types"

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[]
}

// Call the NVIDIA OpenAI-compatible chat-completions endpoint and return the
// assistant's text content. This is the one impure, network-facing seam; a
// different provider would only need to satisfy the same (messages, config) ->
// string contract. Note: gpt-oss returns its chain-of-thought separately in
// `reasoning_content`, which we deliberately ignore — we only want `content`.
export async function chatCompletion(
  messages: ChatMessage[],
  config: InsightsConfig
): Promise<string> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 1,
      top_p: 1,
      max_tokens: 4096,
      stream: false,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(
      `NVIDIA API request failed (${res.status})${body ? `: ${body}` : ""}`
    )
  }

  const data = (await res.json()) as ChatCompletionResponse
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("NVIDIA API returned an empty response.")
  }
  return content
}
