'use client'

/**
 * BookingCalendar – v2 mobile-first calendar for appointment booking.
 * Full-width, teal/emerald themed, with large touch targets.
 * Replaces the desktop-only AppointmentCalendar in the v2 wizard.
 */

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import dayjs from '@/lib/day-utils'
import { cn } from '@/lib/utils'

interface BookingCalendarProps {
  preferredDate?: Date
  availableDates: Date[]
  onSelect: (date: Date | undefined) => void
  isLoading?: boolean
}

export default function BookingCalendar({
  preferredDate,
  availableDates,
  onSelect,
  isLoading = false,
}: BookingCalendarProps) {
  const availableSet = useMemo(
    () =>
      new Set(
        availableDates.map((d) => dayjs(d).startOf('day').format('YYYY-MM-DD'))
      ),
    [availableDates]
  )

  const isAvailable = (day: Date) =>
    availableSet.has(dayjs(day).startOf('day').format('YYYY-MM-DD'))

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid grid-cols-7 gap-1 mt-1">
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-700/50" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 overflow-hidden shadow-sm">
      <DayPicker
        mode="single"
        selected={preferredDate}
        onSelect={onSelect}
        disabled={[
          (d) =>
            dayjs(d).isBefore(dayjs().startOf('day')) || !isAvailable(d),
        ]}
        modifiers={{ available: availableDates }}
        showOutsideDays={false}
        className="w-full p-4"
        classNames={{
          months: 'w-full',
          month: 'w-full space-y-3',
          caption: 'flex justify-center items-center relative mb-1',
          caption_label: 'text-sm font-semibold text-slate-700 dark:text-slate-200',
          nav: 'flex items-center gap-1',
          nav_button: cn(
            'h-8 w-8 rounded-xl flex items-center justify-center',
            'bg-slate-100 hover:bg-teal-50 dark:bg-slate-700 dark:hover:bg-teal-900/40',
            'text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400',
            'transition-colors'
          ),
          nav_button_previous: 'absolute left-0',
          nav_button_next: 'absolute right-0',
          table: 'w-full border-collapse',
          head_row: 'grid grid-cols-7',
          head_cell:
            'text-xs font-medium text-slate-400 dark:text-slate-500 text-center py-1',
          row: 'grid grid-cols-7 mt-1',
          cell: 'relative p-0',
          day: cn(
            'w-full aspect-square min-h-[2.75rem] rounded-xl text-sm font-medium',
            'flex items-center justify-center transition-all',
            'text-slate-400 dark:text-slate-600',
            'disabled:cursor-not-allowed disabled:opacity-40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500'
          ),
          day_selected: cn(
            '!bg-teal-500 !text-white font-bold shadow-md',
            'hover:!bg-teal-600 active:!bg-teal-700'
          ),
          day_today:
            'ring-2 ring-teal-400 ring-offset-1 dark:ring-offset-slate-800',
          day_outside: 'opacity-0 pointer-events-none',
          day_disabled: 'opacity-35 cursor-not-allowed',
          day_hidden: 'invisible',
        }}
        modifiersClassNames={{
          available:
            'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/50 cursor-pointer',
        }}
        components={{
          IconLeft: () => <ChevronLeft className="h-4 w-4" />,
          IconRight: () => <ChevronRight className="h-4 w-4" />,
        }}
      />
      {availableDates.length === 0 && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 pb-4 px-4">
          No available dates for the selected doctor.
        </p>
      )}
    </div>
  )
}
