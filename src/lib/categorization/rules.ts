import type { Category } from "./categorize"

// Built-in registrable-domain → category map, seeded from the README's
// category list. Keys must be registrable domains (see getRegistrableDomain),
// so e.g. mail.google.com resolves to "google.com" before lookup.
export const DOMAIN_CATEGORY_RULES: Record<string, Category> = {
  // Development
  "github.com": "Development",
  "gitlab.com": "Development",
  "bitbucket.org": "Development",
  "stackoverflow.com": "Development",
  "stackexchange.com": "Development",
  "npmjs.com": "Development",
  "codepen.io": "Development",
  "codesandbox.io": "Development",
  "vercel.com": "Development",
  "netlify.com": "Development",
  "jsfiddle.net": "Development",

  // AI
  "openai.com": "AI",
  "chatgpt.com": "AI",
  "claude.ai": "AI",
  "anthropic.com": "AI",
  "perplexity.ai": "AI",
  "huggingface.co": "AI",
  "midjourney.com": "AI",
  "cursor.com": "AI",

  // Documentation
  "developer.mozilla.org": "Documentation",
  "readthedocs.io": "Documentation",
  "w3schools.com": "Documentation",
  "devdocs.io": "Documentation",
  "wikipedia.org": "Documentation",

  // Communication
  "gmail.com": "Communication",
  "outlook.com": "Communication",
  "slack.com": "Communication",
  "discord.com": "Communication",
  "zoom.us": "Communication",
  "telegram.org": "Communication",
  "whatsapp.com": "Communication",

  // Social
  "twitter.com": "Social",
  "x.com": "Social",
  "facebook.com": "Social",
  "instagram.com": "Social",
  "linkedin.com": "Social",
  "reddit.com": "Social",
  "threads.net": "Social",
  "tiktok.com": "Social",

  // Entertainment
  "youtube.com": "Entertainment",
  "netflix.com": "Entertainment",
  "twitch.tv": "Entertainment",
  "spotify.com": "Entertainment",
  "hulu.com": "Entertainment",
  "disneyplus.com": "Entertainment",

  // Shopping
  "amazon.com": "Shopping",
  "ebay.com": "Shopping",
  "etsy.com": "Shopping",
  "aliexpress.com": "Shopping",
  "walmart.com": "Shopping",
  "bestbuy.com": "Shopping",

  // News
  "nytimes.com": "News",
  "bbc.com": "News",
  "bbc.co.uk": "News",
  "cnn.com": "News",
  "theguardian.com": "News",
  "reuters.com": "News",
  "bloomberg.com": "News",
  "techcrunch.com": "News",
  "ycombinator.com": "News",
}
