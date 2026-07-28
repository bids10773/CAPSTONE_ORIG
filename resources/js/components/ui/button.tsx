import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-moss-500/20",
  {
    variants: {
      variant: {
        default:
          "bg-moss-500 text-white shadow-[0_8px_22px_rgba(107,143,113,0.2)] hover:-translate-y-0.5 hover:bg-moss-600 hover:shadow-lg",
        
        // Safety/Emergency Red
        destructive:
          "bg-red-500 text-white shadow-lg hover:bg-red-600 focus-visible:ring-red-500/50",
        
        // Glass effect for moss-background panels
        outline:
          "border border-moss-500 bg-white text-moss-700 hover:bg-moss-50",
        
        // High-contrast white for primary actions on blue backgrounds
        secondary:
          "bg-moss-50 text-moss-700 shadow-sm hover:bg-moss-100",
        
        // Subtle ghosting for less important links
        ghost: "text-slate-600 hover:bg-moss-50 hover:text-moss-700",
        
        // Standard link styling
        link: "text-moss-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
