'use client'

/**
 * BookingTimeSlots – v2 mobile-first time slot grid for appointment booking.
 * Full-width responsive grid (2 cols mobile, 3 cols sm+), h-12 tap targets.
 * Replaces the desktop-only VacantTimeSlot (w-[25rem]) in the v2 wizard.
 */

import { Clock } from 'lucide-react'
import dayjs from '@/lib/day-utils'
import { cn } from '@/lib/utils'

interface TimeSlot {
  start: Date
  end: Date
}

interface BookingTimeSlotsProps {
  timeSlots: TimeSlot[]
  selectedTimeSlot?: TimeSlot
  onSelect: (ts: TimeSlot) => void
  isLoading?: boolean
  preferredDate?: Date
}

const isSameSlot = (a: TimeSlot, b: TimeSlot) =>
  dayjs(a.start).isSame(b.start, 'minute') &&
  dayjs(a.end).isSame(b.end, 'minute')

const formatSlot = (ts: TimeSlot) =>
  `${dayjs(ts.start).format('h:mm A')} – ${dayjs(ts.end).format('h:mm A')}`

export default function BookingTimeSlots({
  timeSlots,
  selectedTimeSlot,
  onSelect,
  isLoading = false,
  preferredDate,
}: BookingTimeSlotsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-slate-100 dark:bg-slate-700/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!preferredDate) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
        <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center">
          Select a date above to see available time slots.
        </p>
      </div>
    )
  }

  if (timeSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/30">
        <Clock className="w-8 h-8 text-amber-300 dark:text-amber-600" />
        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium text-center">
          No available slots for this date.
        </p>
        <p className="text-xs text-amber-500 dark:text-amber-500 text-center">
          Try another date from the calendar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        Available Slots —{' '}
        <span className="text-teal-600 dark:text-teal-400 font-bold">
          {dayjs(preferredDate).format('ddd, MMM D')}
        </span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {timeSlots.map((ts, idx) => {
          const selected = !!selectedTimeSlot && isSameSlot(ts, selectedTimeSlot)
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(ts)}
              aria-pressed={selected}
              className={cn(
                'h-12 w-full rounded-xl text-sm font-semibold transition-all',
                'flex items-center justify-center gap-1.5',
                'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                'active:scale-[0.97]',
                selected
                  ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-200 dark:shadow-teal-900/40'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 dark:hover:border-teal-600'
              )}
            >
              <Clock
                className={cn(
                  'w-3.5 h-3.5 shrink-0',
                  selected
                    ? 'text-white/80'
                    : 'text-teal-500 dark:text-teal-400'
                )}
              />
              <span className="tabular-nums leading-none">
                {dayjs(ts.start).format('h:mm A')}
              </span>
            </button>
          )
        })}
      </div>
      {selectedTimeSlot && (
        <p className="text-xs text-teal-600 dark:text-teal-400 text-center font-medium pt-1">
          Selected: {formatSlot(selectedTimeSlot)}
        </p>
      )}
    </div>
  )
}
