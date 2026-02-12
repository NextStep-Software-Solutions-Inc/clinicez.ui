"use client";

import * as React from "react";
import { format, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@lib/utils";
import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Earliest selectable year (default: 1900) */
  fromYear?: number;
  /** Latest selectable year (default: current year) */
  toYear?: number;
  /** Latest selectable date */
  toDate?: Date;
  /** Earliest selectable date */
  fromDate?: Date;
  className?: string;
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  fromYear = 1900,
  toYear = new Date().getFullYear(),
  toDate,
  fromDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          {value && isValid(value) ? (
            format(value, "MMMM d, yyyy")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          defaultMonth={value}
          captionLayout="dropdown-buttons"
          fromYear={fromYear}
          toYear={toYear}
          toDate={toDate}
          fromDate={fromDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
export type { DatePickerProps };
