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
        // BASE: White border with glass effect
        "peer size-5 shrink-0 rounded-md border-2 border-white/40 bg-white/10 shadow-lg transition-all outline-none",
        
        // CHECKED STATE: Turns solid white so the blue checkmark is visible
        "data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-[#246AFE]",
        
        // HOVER & FOCUS
        "hover:border-white/60 focus-visible:ring-2 focus-visible:ring-white/30",
        
        // DISABLED
        "disabled:cursor-not-allowed disabled:opacity-30",
        
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        {/* Slightly thicker check for medical UI clarity */}
        <CheckIcon className="size-4 stroke-[3px]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
