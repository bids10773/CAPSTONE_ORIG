import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-5 shrink-0 rounded-md border-2 border-slate-300 bg-white text-white shadow-sm transition-all outline-none",
        "data-[state=checked]:border-moss-600 data-[state=checked]:bg-moss-600 data-[state=checked]:text-white",
        "hover:border-moss-500 focus-visible:ring-4 focus-visible:ring-moss-500/20",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="size-4 stroke-[3px] text-white" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
