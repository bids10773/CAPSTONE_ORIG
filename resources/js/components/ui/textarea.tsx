import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[100px] w-full resize-y rounded-xl border border-input bg-white px-3.5 py-3 text-base shadow-none transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-moss-500 focus-visible:ring-4 focus-visible:ring-moss-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
