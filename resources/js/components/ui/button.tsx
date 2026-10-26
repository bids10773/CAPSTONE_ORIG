import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import type { VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "motion-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight transition-[background-color,border-color,color,box-shadow,transform] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-moss-500/20",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_8px_22px_rgba(86,118,92,0.2)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg",
        
        // Safety/Emergency Red
        destructive:
          "bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 focus-visible:ring-destructive/30",
        
        // Glass effect for moss-background panels
        outline:
          "border border-moss-500 bg-background text-moss-700 hover:bg-accent dark:text-moss-200",
        
        // High-contrast white for primary actions on blue backgrounds
        secondary:
          "bg-moss-50 text-moss-700 shadow-sm hover:bg-moss-100 dark:bg-accent dark:text-moss-200 dark:hover:bg-moss-900",
        
        // Subtle ghosting for less important links
        ghost:
          "text-slate-600 hover:bg-moss-50 hover:text-moss-700 dark:text-slate-300 dark:hover:bg-accent dark:hover:text-moss-200",
        
        // Standard link styling
        link: "text-moss-700 underline-offset-4 hover:underline dark:text-moss-200",
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
