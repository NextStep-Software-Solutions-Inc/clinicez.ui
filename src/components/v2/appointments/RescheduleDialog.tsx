"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
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
import { toast } from "sonner";
import { rescheduleAppointmentAction } from "@/actions/appointments/appointment-attribute.action";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import { getAppointmentPatientName } from "./appointment-utils";

type Appointment = NonNullable<GetAppointments["data"]>[number];

interface RescheduleDialogProps {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleDialog({
  open,
  appointment,
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

  const patientName = getAppointmentPatientName(appointment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a new date.");
      return;
    }

    setIsPending(true);
    const result = await rescheduleAppointmentAction({
      appointmentId: appointment.id,
      date: new Date(date),
      timeStart: timeStart || undefined,
      timeEnd: timeEnd || undefined,
    });
    setIsPending(false);

    if (result.status) {
      toast.success(result.message);
      onSuccess();
    } else {
      toast.error(result.message);
    }
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
            Update the date and timeslot for {patientName}. The appointment status will not change.
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
