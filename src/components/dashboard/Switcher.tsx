"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import { LucideIcon, RefreshCw } from "lucide-react"
import Each from "@components/utils/Each"

export type SwitcherOptionsType = {
  label: string
  value: string
  icon: LucideIcon
}

interface SwitcherProps {
  value?: string
  isCollapsed: boolean
  onSwitch?: (value: string) => void
  options: SwitcherOptionsType[]
}

export  default function Switcher({
  value,
  isCollapsed,
  options,
  onSwitch
}: SwitcherProps) {
  const [selectedOption, setSelectedOption] = React.useState<string | undefined>(value)
  
  const handleSwitch = (value: string) => {
    const option = options.find((option) => option.value === value)
    
    if(!option) throw new Error("Invalid option")
    setSelectedOption(prevValue => {
      return option.value
    })
    onSwitch?.(option.value)
  }
  const Icon = options.find((option) => option.value === selectedOption)?.icon ?? RefreshCw
  
  React.useEffect(() => {
    setSelectedOption(value);
  }, [value]);

  return (
    <Select value={selectedOption} onValueChange={handleSwitch}>
      <SelectTrigger
        className={cn(
          "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an option">
          <Icon className="h-4 w-4" />
          <span className={cn("ml-2", isCollapsed && "hidden")}>
            {
              options.find((option) => option.value === selectedOption)
                ?.label
            }
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <Each
          of={options}
          render={(option) => {
            const Icon = option.icon;
            return (
              <SelectItem value={option.value}>
                <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
                  <Icon className="h-4 w-4" />
                  {option.label}
                </div>
              </SelectItem>
            )}}
        />
      </SelectContent>
    </Select>
  )
}
