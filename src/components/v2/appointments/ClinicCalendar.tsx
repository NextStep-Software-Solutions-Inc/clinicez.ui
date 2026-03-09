"use client";

import { useState, useTransition, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Video,
  ExternalLink,
  Users,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { getClinicCalendarEventsAction } from "@/actions/appointments/clinic-calendar.action";
import type { ClinicCalendarEvent } from "@/actions/appointments/clinic-calendar.action";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOOGLE_CALENDAR_EVENT_BASE_URL = "https://calendar.google.com/calendar/event";

interface HpItem {
  id: number;
  name: string;
  picture: string | null;
}

interface ClinicCalendarProps {
  clinicUid: string;
  initialEvents: ClinicCalendarEvent[];
  initialYear: number;
  initialMonth: number;
  hps: HpItem[];
}

// ---------------------------------------------------------------------------
// Status colour helpers
// ---------------------------------------------------------------------------

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; badge: string }> = {
  PENDING:   { bg: "bg-amber-100",  text: "text-amber-800",  badge: "bg-amber-500"  },
  RECEIVED:  { bg: "bg-blue-100",   text: "text-blue-800",   badge: "bg-blue-500"   },
  ROUTED:    { bg: "bg-purple-100", text: "text-purple-800", badge: "bg-purple-500" },
  ACCEPTED:  { bg: "bg-green-100",  text: "text-green-800",  badge: "bg-green-500"  },
  COMPLETED: { bg: "bg-gray-100",   text: "text-gray-600",   badge: "bg-gray-400"   },
  REJECTED:  { bg: "bg-rose-100",   text: "text-rose-800",   badge: "bg-rose-500"   },
};

function getStatusColors(status: string) {
  return STATUS_COLOR_MAP[status] ?? STATUS_COLOR_MAP["PENDING"];
}

// ---------------------------------------------------------------------------
// Month grid helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Returns an array of day numbers (1-based) padded with nulls for week alignment */
function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const grid: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  // Pad to complete last row
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

/** Format a YYYY-MM-DD date string for display */
function formatDayHeader(year: number, month: number, day: number): string {
  try {
    return format(new Date(year, month - 1, day), "EEEE, MMMM d");
  } catch {
    return `${MONTH_NAMES[month - 1]} ${day}`;
  }
}

/** Format a time string like "09:00" for display */
function formatTime(time: string): string {
  if (!time) return "";
  try {
    const [h, m] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return format(date, "h:mm a");
  } catch {
    return time;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface EventPillProps {
  event: ClinicCalendarEvent;
}

function EventPill({ event }: EventPillProps) {
  const colors = getStatusColors(event.status);
  return (
    <div
      className={cn(
        "rounded-sm px-1 py-0.5 text-xs truncate",
        colors.bg,
        colors.text,
      )}
    >
      <span className="font-medium">{event.timeStart ? formatTime(event.timeStart) : ""}</span>
      {event.timeStart && " "}
      <span className="truncate">{event.subject}</span>
    </div>
  );
}

interface DayCellProps {
  day: number | null;
  events: ClinicCalendarEvent[];
  isToday: boolean;
  isSelected: boolean;
  onClick: (day: number) => void;
}

function DayCell({ day, events, isToday, isSelected, onClick }: DayCellProps) {
  if (day === null) {
    return <div className="min-h-[90px] bg-muted/20 rounded-md" />;
  }

  const visible = events.slice(0, 3);
  const overflow = events.length - 3;

  return (
    <button
      type="button"
      onClick={() => onClick(day)}
      className={cn(
        "min-h-[90px] p-1.5 rounded-md border text-left transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring",
        isSelected && "ring-2 ring-primary bg-primary/5 border-primary",
        !isSelected && "border-border",
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mb-1",
          isToday && "bg-primary text-primary-foreground",
          !isToday && "text-foreground",
        )}
      >
        {day}
      </span>

      {/* Event pills */}
      <div className="flex flex-col gap-0.5">
        {visible.map((ev) => (
          <EventPill key={ev.id} event={ev} />
        ))}
        {overflow > 0 && (
          <span className="text-xs text-muted-foreground pl-1">+{overflow} more</span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ClinicCalendar({
  clinicUid,
  initialEvents,
  initialYear,
  initialMonth,
  hps,
}: ClinicCalendarProps) {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [events, setEvents] = useState<ClinicCalendarEvent[]>(initialEvents);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedHpIds, setSelectedHpIds] = useState<number[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Today info
  const todayObj = new Date();
  const todayYear = todayObj.getFullYear();
  const todayMonth = todayObj.getMonth() + 1;
  const todayDay = todayObj.getDate();

  // Filter events by selected HPs
  const filteredEvents = useMemo(() => {
    if (selectedHpIds.length === 0) return events;
    return events.filter((ev) =>
      ev.providers.some((p) => selectedHpIds.includes(p.id)),
    );
  }, [events, selectedHpIds]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<number, ClinicCalendarEvent[]>();
    for (const ev of filteredEvents) {
      if (!ev.date) continue;
      try {
        const d = parseISO(ev.date).getDate();
        const existing = map.get(d) ?? [];
        existing.push(ev);
        map.set(d, existing);
      } catch (err) {
        console.warn(`[ClinicCalendar] Skipping appointment id=${ev.id}: invalid date "${ev.date}"`, err);
      }
    }
    return map;
  }, [filteredEvents]);

  // Calendar grid
  const grid = useMemo(
    () => buildCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  // Navigate month
  function navigateMonth(delta: number) {
    let newYear = currentYear;
    let newMonth = currentMonth + delta;
    if (newMonth > 12) { newMonth = 1; newYear += 1; }
    if (newMonth < 1)  { newMonth = 12; newYear -= 1; }

    startTransition(async () => {
      const result = await getClinicCalendarEventsAction(clinicUid, newYear, newMonth);
      if (result.status && result.data) {
        setEvents(result.data);
        setCurrentYear(newYear);
        setCurrentMonth(newMonth);
        setSelectedDay(null);
        setIsDetailOpen(false);
      } else {
        toast.error(result.message ?? "Failed to load calendar events. Please try again.");
      }
    });
  }

  function handleDayClick(day: number) {
    setSelectedDay(day);
    setIsDetailOpen(true);
  }

  function toggleHp(id: number) {
    setSelectedHpIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Events for the selected day (for side panel)
  const selectedDayEvents = useMemo(() => {
    if (selectedDay === null) return [];
    return eventsByDay.get(selectedDay) ?? [];
  }, [selectedDay, eventsByDay]);

  const selectedDayLabel =
    selectedDay !== null
      ? formatDayHeader(currentYear, currentMonth, selectedDay)
      : "";

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Clinic Calendar</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* HP filter popover */}
          {hps.length > 0 && (
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  Filter by member
                  {selectedHpIds.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      {selectedHpIds.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                  Filter by healthcare provider
                </p>
                <div className="space-y-1">
                  {selectedHpIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedHpIds([])}
                      className="w-full text-left text-xs text-primary px-2 py-1 rounded hover:bg-accent"
                    >
                      Clear all
                    </button>
                  )}
                  {hps.map((hp) => {
                    const selected = selectedHpIds.includes(hp.id);
                    return (
                      <button
                        key={hp.id}
                        type="button"
                        onClick={() => toggleHp(hp.id)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                          selected && "bg-accent",
                        )}
                      >
                        <Avatar className="h-5 w-5">
                          {hp.picture && <AvatarImage src={hp.picture} alt={hp.name} />}
                          <AvatarFallback className="text-[10px]">
                            {hp.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate text-left">{hp.name}</span>
                        {selected && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Month navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth(-1)}
              disabled={isPending}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="min-w-[140px] text-center text-sm font-semibold">
              {isPending ? (
                <span className="text-muted-foreground">Loading…</span>
              ) : (
                `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`
              )}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth(1)}
              disabled={isPending}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Calendar grid                                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-border p-px">
          {grid.map((day, idx) => (
            <div key={idx} className="bg-background">
              <DayCell
                day={day}
                events={day !== null ? (eventsByDay.get(day) ?? []) : []}
                isToday={
                  day !== null &&
                  currentYear === todayYear &&
                  currentMonth === todayMonth &&
                  day === todayDay
                }
                isSelected={day !== null && day === selectedDay}
                onClick={handleDayClick}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Detail sheet                                                     */}
      {/* ---------------------------------------------------------------- */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2 border-b">
            <SheetTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              {selectedDayLabel}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
                  <CalendarDays className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No appointments scheduled for this day.</p>
                </div>
              ) : (
                selectedDayEvents.map((ev) => {
                  const colors = getStatusColors(ev.status);
                  return (
                    <div
                      key={ev.id}
                      className="rounded-lg border bg-card p-3 space-y-2 shadow-sm"
                    >
                      {/* Time + subject */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold leading-tight">{ev.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ev.timeStart ? formatTime(ev.timeStart) : "—"}
                            {ev.timeEnd ? ` – ${formatTime(ev.timeEnd)}` : ""}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "shrink-0 text-white text-xs",
                            colors.badge,
                          )}
                        >
                          {ev.status}
                        </Badge>
                      </div>

                      {/* Mode & type */}
                      <div className="flex flex-wrap gap-1">
                        {ev.mode && (
                          <span className="inline-flex text-xs bg-secondary text-secondary-foreground rounded px-1.5 py-0.5">
                            {ev.mode}
                          </span>
                        )}
                        {ev.type && (
                          <span className="inline-flex text-xs bg-secondary text-secondary-foreground rounded px-1.5 py-0.5">
                            {ev.type}
                          </span>
                        )}
                      </div>

                      {/* Patient */}
                      {ev.patient && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Avatar className="h-4 w-4">
                            {ev.patient.picture && (
                              <AvatarImage
                                src={ev.patient.picture}
                                alt={ev.patient.name}
                              />
                            )}
                            <AvatarFallback className="text-[9px]">
                              {ev.patient.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{ev.patient.name}</span>
                        </div>
                      )}

                      {/* Providers */}
                      {ev.providers.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {ev.providers.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-1 text-xs text-muted-foreground"
                            >
                              <Avatar className="h-4 w-4">
                                {p.picture && (
                                  <AvatarImage src={p.picture} alt={p.name} />
                                )}
                                <AvatarFallback className="text-[9px]">
                                  {p.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{p.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action links */}
                      <div className="flex gap-2 pt-1">
                        {ev.meetingUrl && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5"
                          >
                            <a
                              href={ev.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Video className="h-3 w-3" />
                              Join Meet
                            </a>
                          </Button>
                        )}
                        {ev.eventId && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5"
                          >
                            <a
                              href={`${GOOGLE_CALENDAR_EVENT_BASE_URL}?eid=${ev.eventId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Calendar
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
