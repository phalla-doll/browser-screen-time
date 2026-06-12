import { useState } from "react"

import { cn } from "@/lib/utils"

// Renders a site's favicon, falling back to a neutral monogram tile when the
// icon is missing or fails to load. `src` comes from a captured tab favicon URL
// (see tracker.ts) and may point at a third-party host, so loading is lazy and
// errors degrade gracefully rather than showing a broken-image glyph.
export function Favicon({
  src,
  domain,
  className,
}: {
  src?: string
  domain: string
  className?: string
}) {
  // Track the URL that failed rather than a boolean, so reusing the row for a
  // different site automatically clears the fallback without an effect.
  const [failedSrc, setFailedSrc] = useState<string>()

  const base = "size-4 shrink-0 rounded-[4px]"

  if (!src || failedSrc === src) {
    return (
      <span
        aria-hidden
        className={cn(
          base,
          "flex items-center justify-center bg-muted text-[9px] font-semibold text-muted-foreground uppercase",
          className
        )}
      >
        {domain.charAt(0)}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      width={16}
      height={16}
      onError={() => setFailedSrc(src)}
      className={cn(base, "object-contain", className)}
    />
  )
}
