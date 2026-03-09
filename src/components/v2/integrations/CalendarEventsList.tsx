import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { Calendar, Clock, MapPin, Video, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CalendarEventItem } from "@/actions/google/auth.action";

interface CalendarEventsListProps {
  events: CalendarEventItem[];
}

export function CalendarEventsList({ events }: CalendarEventsListProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming events found in your Google Calendar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-primary" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {events.map((event, index) => {
          // Parse once and reuse for all date operations below
          const startDate = event.start ? parseISO(event.start) : null;
          const relativeLabel = startDate
            ? isToday(startDate)
              ? "Today"
              : isTomorrow(startDate)
              ? "Tomorrow"
              : null
            : null;
          return (
            <div
              key={event.id}
              className={`px-6 py-3 flex items-start gap-3 ${
                index < events.length - 1 ? "border-b" : ""
              }`}
            >
              {/* Date badge */}
              <div className="flex-shrink-0 w-10 flex flex-col items-center pt-0.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase leading-none">
                  {startDate ? format(startDate, "MMM") : ""}
                </span>
                <span className="text-lg font-bold leading-none mt-0.5">
                  {startDate ? format(startDate, "d") : ""}
                </span>
              </div>

              {/* Event details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <span
                    className="font-medium text-sm truncate max-w-full"
                    title={event.summary}
                  >
                    {event.summary}
                  </span>
                  {relativeLabel && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
                      {relativeLabel}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 mt-1">
                  {!event.isAllDay && startDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>{format(startDate, "MMMM d, yyyy • h:mm a")}</span>
                    </div>
                  )}
                  {event.isAllDay && startDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>All day · {format(startDate, "MMMM d, yyyy")}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>

                {/* Action links */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {event.hangoutLink && (
                    <a
                      href={event.hangoutLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <Video className="h-3 w-3" />
                      Join Google Meet
                    </a>
                  )}
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in Google Calendar
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
