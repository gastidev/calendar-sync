import * as React from "react"

import { cn } from "@/lib/utils"

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer group">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div className={cn(
          "w-12 h-7 bg-muted backdrop-blur-sm rounded-full peer transition-all duration-300",
          "peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20",
          "peer-checked:bg-gradient-primary",
          "after:content-[''] after:absolute after:top-[3px] after:start-[3px]",
          "after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300",
          "after:shadow-md",
          "peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5",
          "dark:bg-muted/50 hover:shadow-md group-hover:shadow-lg",
          className
        )}></div>
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
