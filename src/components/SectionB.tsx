"use client"

import HeaderTitle from "./HeaderTitle"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { cn } from "@/lib/utils"

interface SectionBProps {
  header: string
  description?: string
  placeholder?: string
  btnVal?: string
  className?: string
  variant?: "default" | "centered" | "compact"
  onButtonClick?: () => void
  inputClassName?: string
  buttonClassName?: string
}

export default function SectionB({
  header,
  description,
  placeholder,
  btnVal,
  className,
  variant = "default",
  onButtonClick,
  inputClassName,
  buttonClassName,
}: SectionBProps) {
  const hasInputWithButton = placeholder && btnVal

  const containerVariants = {
    default: "space-y-8 py-12 px-6",
    centered: "space-y-8 py-16 px-6 max-w-2xl mx-auto",
    compact: "space-y-6 py-8 px-4",
  }

  return (
    <div className="bg-white">
      <div className={cn("w-full bg-primary/20", containerVariants[variant], className)}>
        {/* Header Section */}
        <div className="space-y-2">
          <HeaderTitle 
            header={header} 
            description={description} />
        </div>

        {/* Action Section */}
        <div className="flex flex-col items-center space-y-4">
          {hasInputWithButton ? (
            <div className="w-full max-w-md space-y-4">
              <div className="relative group">
                <Input
                  placeholder={placeholder}
                  withButton={true}
                  btnValue={btnVal}
                  onButtonClick={onButtonClick}
                  className={cn("transition-all duration-200 focus:scale-[1.02] focus:shadow-lg", inputClassName)}
                />
              </div>
            </div>
          ) : btnVal ? (
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={onButtonClick}
                size="lg"
                className={cn(
                  "px-8 py-3 text-base font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg",
                  buttonClassName,
                )}
              >
                {btnVal}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
