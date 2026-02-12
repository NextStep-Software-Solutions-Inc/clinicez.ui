"use client"

import * as React from "react"
import { format, setMonth, setYear } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"

import { cn } from "@lib/utils"
import { Button } from "@components/ui/button"
import { Calendar, type CalendarProps } from "@components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"

export type DatePickerProps = CalendarProps & {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  toDate,
}: DatePickerProps) {
  const [month, setMonthState] = React.useState<number>(value?.getMonth() ?? new Date().getMonth())
  const [year, setYearState] = React.useState<number>(value?.getFullYear() ?? new Date().getFullYear())

  const currentDate = new Date(year, month)
  const maxYear = toDate?.getFullYear() ?? new Date().getFullYear()

  const handleMonthChange = (newMonth: string) => {
    setMonthState(parseInt(newMonth))
  }

  const handleYearChange = (newYear: string) => {
    setYearState(parseInt(newYear))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b space-y-3">
          <div className="flex gap-2">
            <Select value={String(month)} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {format(new Date(2024, i), "MMMM")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxYear - 1900 + 1 }, (_, i) => 1900 + i).reverse().map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          month={currentDate}
          onMonthChange={(date) => {
            setMonthState(date.getMonth())
            setYearState(date.getFullYear())
          }}
          initialFocus
          toDate={toDate}
        />
      </PopoverContent>
    </Popover>
  )
}
DatePicker.displayName = "DatePicker"

export { DatePicker }
