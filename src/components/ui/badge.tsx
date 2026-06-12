import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

function Badge({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
