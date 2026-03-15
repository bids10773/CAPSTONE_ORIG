import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold tracking-tight transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/20",
  {
    variants: {
      variant: {
        // High-impact Blue with a glow shadow
        default:
          "bg-[#246AFE] text-white shadow-[0_8px_25px_rgba(36,106,254,0.3)] hover:bg-blue-600 hover:shadow-blue-500/40",
        
        // Safety/Emergency Red
        destructive:
          "bg-red-500 text-white shadow-lg hover:bg-red-600 focus-visible:ring-red-500/50",
        
        // Glass effect for blue-background panels
        outline:
          "border-2 border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:border-white/40",
        
        // High-contrast white for primary actions on blue backgrounds
        secondary:
          "bg-white text-[#246AFE] shadow-xl hover:bg-blue-50 hover:text-blue-700",
        
        // Subtle ghosting for less important links
        ghost: "text-white/70 hover:bg-white/10 hover:text-white",
        
        // Standard link styling
        link: "text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-lg uppercase font-black tracking-widest", 
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
