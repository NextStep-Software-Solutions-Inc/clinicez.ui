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
  Clock,
  User,
  X,
  CheckCheck,
  Loader2,
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
import { Separator } from "@/components/ui/separator";
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

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; border: string; badgeBg: string; badgeText: string; label: string }
> = {
  PENDING:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   border: "border-l-amber-400",   badgeBg: "bg-amber-100",   badgeText: "text-amber-700",   label: "Pending"   },
  RECEIVED:  { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400",    border: "border-l-blue-400",    badgeBg: "bg-blue-100",    badgeText: "text-blue-700",    label: "Received"  },
  ROUTED:    { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400",  border: "border-l-violet-400",  badgeBg: "bg-violet-100",  badgeText: "text-violet-700",  label: "Routed"    },
  ACCEPTED:  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", border: "border-l-emerald-400", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700", label: "Accepted"  },
  COMPLETED: { bg: "bg-slate-50",   text: "text-slate-500",   dot: "bg-slate-400",   border: "border-l-slate-300",   badgeBg: "bg-slate-100",   badgeText: "text-slate-500",   label: "Completed" },
  REJECTED:  { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400",    border: "border-l-rose-400",    badgeBg: "bg-rose-100",    badgeText: "text-rose-700",    label: "Rejected"  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG["PENDING"];
}

// ---------------------------------------------------------------------------
// Month grid helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS_LONG  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_HEADERS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAY_HEADERS_MED   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Returns an array of day numbers (1-based) padded with nulls for week alignment */
function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const grid: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

/** Format a YYYY-MM-DD date string for display */
function formatDayHeader(year: number, month: number, day: number): string {
  try {
    const isCurrentYear = year === new Date().getFullYear();
    const dateFormat = isCurrentYear ? "EEEE, MMMM d" : "EEEE, MMMM d, yyyy";
    return format(new Date(year, month - 1, day), dateFormat);
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
  const cfg = getStatusConfig(event.status);
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs truncate leading-tight",
        cfg.bg,
        cfg.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      <span className="truncate">
        {event.timeStart ? `${formatTime(event.timeStart)} ` : ""}
        {event.subject}
      </span>
    </div>
  );
}

interface DayCellProps {
  day: number | null;
  events: ClinicCalendarEvent[];
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  onClick: (day: number) => void;
}

function DayCell({ day, events, isToday, isSelected, isWeekend, onClick }: DayCellProps) {
  if (day === null) {
    return (
      <div
        className={cn(
          "h-full min-h-[80px] sm:min-h-[110px]",
          isWeekend ? "bg-muted/30" : "bg-muted/10",
        )}
      />
    );
  }

  const visible = events.slice(0, 3);
  const overflow = events.length - 3;

  return (
    <button
      type="button"
      onClick={() => onClick(day)}
      className={cn(
        "group relative w-full min-h-[80px] sm:min-h-[110px] p-1.5 sm:p-2 text-left transition-all",
        "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isWeekend && !isSelected && "bg-muted/20",
        isSelected && "bg-primary/5 ring-2 ring-inset ring-primary/70",
      )}
    >
      {/* Day number */}
      <div className="mb-1 sm:mb-1.5">
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
            isToday
              ? "bg-primary text-primary-foreground shadow-sm"
              : isSelected
              ? "text-primary font-bold"
              : "text-foreground group-hover:text-primary",
          )}
        >
          {day}
        </span>
      </div>

      {/* Event pills — hidden on very small screens, show dots instead */}
      <div className="hidden sm:flex flex-col gap-0.5">
        {visible.map((ev) => (
          <EventPill key={ev.id} event={ev} />
        ))}
        {overflow > 0 && (
          <span className="text-[10px] font-medium text-muted-foreground pl-0.5">
            +{overflow} more
          </span>
        )}
      </div>

      {/* Mobile: coloured dots */}
      {events.length > 0 && (
        <div className="flex sm:hidden items-center gap-0.5 flex-wrap mt-0.5">
          {events.slice(0, 4).map((ev) => {
            const cfg = getStatusConfig(ev.status);
            return (
              <span
                key={ev.id}
                className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)}
              />
            );
          })}
          {events.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{events.length - 4}</span>
          )}
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

interface StatsBarProps {
  events: ClinicCalendarEvent[];
}

function StatsBar({ events }: StatsBarProps) {
  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const ev of events) {
      acc[ev.status] = (acc[ev.status] ?? 0) + 1;
    }
    return acc;
  }, [events]);

  const total = events.length;
  if (total === 0) return null;

  const displayStatuses = Object.keys(STATUS_CONFIG).filter((s) => (counts[s] ?? 0) > 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">
        {total} appointment{total !== 1 ? "s" : ""}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {displayStatuses.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <span
              key={s}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                cfg.badgeBg,
                cfg.badgeText,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {cfg.label}: {counts[s]}
            </span>
          );
        })}
      </div>
    </div>
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
  const isViewingToday = currentYear === todayYear && currentMonth === todayMonth;

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
        console.warn(
          `[ClinicCalendar] Skipping appointment id=${ev.id}: invalid date "${ev.date}"`,
          err,
        );
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

  function goToToday() {
    if (isViewingToday) return;
    startTransition(async () => {
      const result = await getClinicCalendarEventsAction(clinicUid, todayYear, todayMonth);
      if (result.status && result.data) {
        setEvents(result.data);
        setCurrentYear(todayYear);
        setCurrentMonth(todayMonth);
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
    <div className="flex flex-col gap-0 min-h-0">
      {/* ================================================================ */}
      {/* Header card                                                      */}
      {/* ================================================================ */}
      <div className="bg-card border-b px-4 sm:px-6 py-4">
        {/* Top row: title + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight text-foreground">Clinic Calendar</h1>
              <p className="text-xs text-muted-foreground">Manage and view appointments by month</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Today button */}
            {!isViewingToday && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                disabled={isPending}
                className="h-8 text-xs"
              >
                Today
              </Button>
            )}

            {/* HP filter */}
            {hps.length > 0 && (
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedHpIds.length > 0 ? "default" : "outline"}
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Filter</span>
                    {selectedHpIds.length > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-background/20 text-[10px] font-bold">
                        {selectedHpIds.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-60 p-0">
                  <div className="flex items-center justify-between px-3 py-2.5 border-b">
                    <p className="text-xs font-semibold text-foreground">Healthcare Providers</p>
                    {selectedHpIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedHpIds([])}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 space-y-0.5 max-h-56 overflow-y-auto">
                    {hps.map((hp) => {
                      const selected = selectedHpIds.includes(hp.id);
                      return (
                        <button
                          key={hp.id}
                          type="button"
                          onClick={() => toggleHp(hp.id)}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                            selected
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-accent text-foreground",
                          )}
                        >
                          <Avatar className="h-6 w-6 shrink-0">
                            {hp.picture && <AvatarImage src={hp.picture} alt={hp.name} />}
                            <AvatarFallback className="text-[10px] font-semibold">
                              {hp.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1 truncate text-left text-sm">{hp.name}</span>
                          {selected && <CheckCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Month navigator */}
            <div className="flex items-center rounded-lg border bg-background overflow-hidden h-8">
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                disabled={isPending}
                aria-label="Previous month"
                className="flex h-full w-8 items-center justify-center border-r text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center justify-center px-3 min-w-[130px]">
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                    {MONTH_NAMES[currentMonth - 1]} {currentYear}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                disabled={isPending}
                aria-label="Next month"
                className="flex h-full w-8 items-center justify-center border-l text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {filteredEvents.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <StatsBar events={filteredEvents} />
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* Calendar grid                                                    */}
      {/* ================================================================ */}
      <div
        className={cn(
          "flex-1 overflow-hidden rounded-b-xl border-x border-b bg-card shadow-sm transition-opacity",
          isPending && "opacity-50 pointer-events-none",
        )}
      >
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {DAY_HEADERS_SHORT.map((short, i) => (
            <div
              key={short}
              className={cn(
                "py-2.5 text-center",
                (i === 0 || i === 6) && "text-muted-foreground/60",
              )}
            >
              {/* Extra small screens: 2-letter */}
              <span className="sm:hidden text-[11px] font-semibold text-muted-foreground">
                {short}
              </span>
              {/* Small-medium: 3-letter */}
              <span className="hidden sm:inline lg:hidden text-xs font-semibold text-muted-foreground">
                {DAY_HEADERS_MED[i]}
              </span>
              {/* Large+: full name */}
              <span className="hidden lg:inline text-xs font-semibold text-muted-foreground">
                {DAY_HEADERS_LONG[i]}
              </span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {grid.map((day, idx) => {
            const colIndex = idx % 7;
            const isWeekend = colIndex === 0 || colIndex === 6;
            return (
              <DayCell
                key={idx}
                day={day}
                events={day !== null ? (eventsByDay.get(day) ?? []) : []}
                isToday={
                  day !== null &&
                  currentYear === todayYear &&
                  currentMonth === todayMonth &&
                  day === todayDay
                }
                isSelected={day !== null && day === selectedDay}
                isWeekend={isWeekend}
                onClick={handleDayClick}
              />
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* Detail sheet                                                     */}
      {/* ================================================================ */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[420px] p-0 flex flex-col gap-0"
        >
          {/* Sheet header */}
          <SheetHeader className="px-5 pt-5 pb-4 border-b shrink-0 space-y-1">
            <SheetTitle className="flex items-center gap-2 text-base leading-tight">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="truncate">{selectedDayLabel}</span>
            </SheetTitle>
            {selectedDayEvents.length > 0 && (
              <p className="text-xs text-muted-foreground pl-9">
                {selectedDayEvents.length} appointment{selectedDayEvents.length !== 1 ? "s" : ""}
              </p>
            )}
          </SheetHeader>

          {/* Events list */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <CalendarDays className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No appointments</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Nothing scheduled for this day.
                    </p>
                  </div>
                </div>
              ) : (
                selectedDayEvents.map((ev, index) => {
                  const cfg = getStatusConfig(ev.status);
                  return (
                    <div key={ev.id}>
                      <div
                        className={cn(
                          "rounded-xl border bg-card overflow-hidden shadow-sm",
                          "border-l-4",
                          cfg.border,
                        )}
                      >
                        <div className="p-4 space-y-3">
                          {/* Subject + status */}
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-snug text-foreground">
                              {ev.subject}
                            </p>
                            <span
                              className={cn(
                                "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                cfg.badgeBg,
                                cfg.badgeText,
                              )}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          {/* Time */}
                          {(ev.timeStart ?? ev.timeEnd) && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                {ev.timeStart ? formatTime(ev.timeStart) : "—"}
                                {ev.timeEnd ? ` – ${formatTime(ev.timeEnd)}` : ""}
                              </span>
                            </div>
                          )}

                          {/* Mode & type tags */}
                          {(ev.mode ?? ev.type) && (
                            <div className="flex flex-wrap gap-1">
                              {ev.mode && (
                                <span className="inline-flex items-center rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                  {ev.mode}
                                </span>
                              )}
                              {ev.type && (
                                <span className="inline-flex items-center rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                  {ev.type}
                                </span>
                              )}
                            </div>
                          )}

                          <Separator className="my-0" />

                          {/* Patient */}
                          {ev.patient && (
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <Avatar className="h-5 w-5 shrink-0">
                                {ev.patient.picture && (
                                  <AvatarImage src={ev.patient.picture} alt={ev.patient.name} />
                                )}
                                <AvatarFallback className="text-[10px] font-semibold">
                                  {ev.patient.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-foreground font-medium truncate">
                                {ev.patient.name}
                              </span>
                            </div>
                          )}

                          {/* Providers */}
                          {ev.providers.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                              <div className="flex flex-wrap gap-1.5">
                                {ev.providers.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-2 py-0.5"
                                  >
                                    <Avatar className="h-4 w-4 shrink-0">
                                      {p.picture && (
                                        <AvatarImage src={p.picture} alt={p.name} />
                                      )}
                                      <AvatarFallback className="text-[8px] font-semibold">
                                        {p.name.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-[11px] font-medium text-foreground">{p.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action links */}
                          {(ev.meetingUrl ?? ev.eventId) && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {ev.meetingUrl && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 flex-1"
                                >
                                  <a
                                    href={ev.meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Video className="h-3.5 w-3.5" />
                                    Join Video Call
                                  </a>
                                </Button>
                              )}
                              {ev.eventId && (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs gap-1.5"
                                >
                                  <a
                                    href={`${GOOGLE_CALENDAR_EVENT_BASE_URL}?eid=${ev.eventId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View in Google Calendar
                                  </a>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {index < selectedDayEvents.length - 1 && (
                        <div className="flex justify-center my-1">
                          <div className="h-2 w-px bg-border" />
                        </div>
                      )}
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
