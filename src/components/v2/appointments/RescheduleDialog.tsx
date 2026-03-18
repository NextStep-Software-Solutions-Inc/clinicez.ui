"use client";

import { useState } from "react";
import { CalendarDays, Stethoscope, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { rescheduleAppointmentAction } from "@/actions/appointments/appointment-attribute.action";
import { updateCalendarEvent } from "@/actions/google/auth.action";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import type { GetHPsType } from "@/actions/hp.actions";
import { getAppointmentPatientName } from "./appointment-utils";

type Appointment = NonNullable<GetAppointments["data"]>[number];

interface RescheduleDialogProps {
  open: boolean;
  appointment: Appointment;
  hps: GetHPsType;
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleDialog({
  open,
  appointment,
  hps,
  onClose,
  onSuccess,
}: RescheduleDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [date, setDate] = useState(
    appointment.AppointmentAttribute?.date
      ? new Date(appointment.AppointmentAttribute.date).toISOString().split("T")[0]
      : ""
  );
  const [timeStart, setTimeStart] = useState(appointment.AppointmentAttribute?.timeStart ?? "");
  const [timeEnd, setTimeEnd] = useState(appointment.AppointmentAttribute?.timeEnd ?? "");

  // Pre-fill with the most recently routed HP
  const currentRouting = appointment.AppointmentRouting
    ?.filter((r) => r.status === "PENDING" || r.status === "ACCEPTED")
    .sort((a, b) => b.id - a.id)[0];
  const currentHpId = currentRouting?.RoutedTo?.id ?? null;
  const [selectedHpId, setSelectedHpId] = useState<number | null>(currentHpId);

  const patientName = getAppointmentPatientName(appointment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a new date.");
      return;
    }

    if (timeStart && timeEnd && timeEnd <= timeStart) {
      toast.error("End time must be later than start time.");
      return;
    }

    setIsPending(true);
    const result = await rescheduleAppointmentAction({
      appointmentId: appointment.id,
      date: new Date(date),
      timeStart: timeStart || undefined,
      timeEnd: timeEnd || undefined,
      // Only send newHpId if it changed
      newHpId: selectedHpId !== currentHpId && selectedHpId !== null ? selectedHpId : undefined,
    });

    if (!result.status) {
      setIsPending(false);
      toast.error(result.message);
      return;
    }

    // Always attempt to update or create the Google Calendar event
    const calResult = await updateCalendarEvent(appointment.id);
    if (!calResult.status) {
      toast.success(result.message);
      toast.warning("Appointment rescheduled but Google Calendar was not updated: " + calResult.message);
    } else if (calResult.data?.touched) {
      toast.success(`${result.message} — ${calResult.message}`);
    } else {
      toast.success(result.message);
    }

    setIsPending(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Reschedule Appointment
          </SheetTitle>
          <SheetDescription>
            Update the date, timeslot, or assigned provider for {patientName}. Status will not change.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current schedule (read-only) */}
          {appointment.AppointmentAttribute?.date && (
            <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-0.5">
              <span className="text-muted-foreground text-xs block">Current schedule</span>
              <span className="font-medium">
                {new Date(appointment.AppointmentAttribute.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                {appointment.AppointmentAttribute.timeStart && (
                  <> · {appointment.AppointmentAttribute.timeStart}</>
                )}
              </span>
            </div>
          )}

          {/* New Date */}
          <div className="space-y-1.5">
            <Label htmlFor="reschedule-date" className="text-xs font-medium">
              New Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reschedule-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* New Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-time-start" className="text-xs font-medium">
                Time Start
              </Label>
              <Input
                id="reschedule-time-start"
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-time-end" className="text-xs font-medium">
                Time End
              </Label>
              <Input
                id="reschedule-time-end"
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Healthcare Provider selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              Assign Healthcare Provider
              {currentHpId && <span className="text-muted-foreground font-normal">(change to reassign)</span>}
            </Label>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {hps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No healthcare providers available.
                </p>
              ) : (
                hps.map((hp) => {
                  const name =
                    hp.HPProfile?.name ??
                    `${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim();
                  const initials = `${hp.User.firstName?.charAt(0) ?? ""}${hp.User.lastName?.charAt(0) ?? ""}`;
                  const isSelected = selectedHpId === hp.id;
                  const isCurrent = currentHpId === hp.id;

                  return (
                    <button
                      key={hp.id}
                      type="button"
                      onClick={() => setSelectedHpId(hp.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-150 ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-background/50 hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <Avatar className="h-8 w-8 rounded-full flex-shrink-0">
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {initials || <User className="h-3.5 w-3.5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">
                          {hp.HPProfile?.title ? `${hp.HPProfile.title} ` : ""}{name}
                        </p>
                        {hp.HPType?.name && (
                          <p className="text-xs text-muted-foreground">{hp.HPType.name}</p>
                        )}
                        {isCurrent && !isSelected && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 mt-0.5 border-amber-400/50 text-amber-600">
                            Currently assigned
                          </Badge>
                        )}
                        {isCurrent && isSelected && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 mt-0.5">
                            No change
                          </Badge>
                        )}
                      </div>
                      {isSelected && !isCurrent && (
                        <div className="w-3.5 h-3.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary/90 hover:bg-primary"
              disabled={isPending || !date}
            >
              {isPending ? "Saving..." : "Reschedule"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
