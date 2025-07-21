"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  withButton?: boolean
  btnBg?: string
  btnValue?: string
  onButtonClick?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, withButton, btnBg, btnValue = "Submit", onButtonClick, ...props }, ref) => {
    if (withButton) {
      return (
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-20 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            ref={ref}
            {...props}
          />
          <Button
            type="button"
            onClick={onButtonClick}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 flex h-6 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap",
              btnBg || "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {btnValue}
          </Button>
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)

Input.displayName = "Input"

export { Input }
