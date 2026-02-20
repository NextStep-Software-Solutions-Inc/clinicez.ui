"use client";

import { useState } from "react";
import { CalendarDays, Stethoscope } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { confirmAppointmentBookingAction } from "@/actions/appointments/appointment-attribute.action";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import type { GetAppointmentModes } from "@/actions/appointments/appointment-mode.action";
import type { GetAppointmentTypes } from "@/actions/appointments/appointment-type.action";
import type { GetClinicServices } from "@/actions/clinics/clinic-service.action";
import type { GetHPsType } from "@/actions/hp.actions";

type Appointment = GetAppointments["data"][number];

interface ConfirmBookingSheetProps {
  open: boolean;
  appointment: Appointment;
  modes: GetAppointmentModes;
  types: GetAppointmentTypes;
  services: GetClinicServices;
  hps: GetHPsType;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfirmBookingSheet({
  open,
  appointment,
  modes,
  types,
  services,
  hps,
  onClose,
  onSuccess,
}: ConfirmBookingSheetProps) {
  const [isPending, setIsPending] = useState(false);
  const [modeId, setModeId] = useState<string>("");
  const [typeId, setTypeId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [hpId, setHpId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modeId || !typeId || !serviceId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsPending(true);
    const result = await confirmAppointmentBookingAction({
      appointmentId: appointment.id,
      modeId: parseInt(modeId),
      typeId: parseInt(typeId),
      serviceId: parseInt(serviceId),
      hpId: hpId ? parseInt(hpId) : undefined,
      date: date ? new Date(date) : undefined,
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

  const requester = appointment.Requesters?.[0]?.User;
  const patientName = requester
    ? `${requester.firstName ?? ""} ${requester.lastName ?? ""}`.trim()
    : "Unknown Patient";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Confirm Booking
          </SheetTitle>
          <SheetDescription>
            Confirm appointment for {patientName}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject (read-only) */}
          <div className="rounded-lg bg-muted/30 p-3 text-sm">
            <span className="text-muted-foreground text-xs">Subject: </span>
            <span className="font-medium">{appointment.subject}</span>
          </div>

          {/* Mode */}
          <div className="space-y-1.5">
            <Label htmlFor="mode" className="text-xs font-medium">
              Appointment Mode <span className="text-destructive">*</span>
            </Label>
            <Select value={modeId} onValueChange={setModeId}>
              <SelectTrigger id="mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {modes.map((mode) => (
                  <SelectItem key={mode.id} value={String(mode.id)}>
                    {mode.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="type" className="text-xs font-medium">
              Appointment Type <span className="text-destructive">*</span>
            </Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service */}
          <div className="space-y-1.5">
            <Label htmlFor="service" className="text-xs font-medium">
              Service <span className="text-destructive">*</span>
            </Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger id="service">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={String(service.id)}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assign Doctor (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="hp" className="text-xs font-medium">
              Assign Doctor{" "}
              <span className="text-muted-foreground font-normal">(optional — routes immediately)</span>
            </Label>
            <Select value={hpId} onValueChange={setHpId}>
              <SelectTrigger id="hp">
                <SelectValue placeholder="Select doctor (optional)" />
              </SelectTrigger>
              <SelectContent>
                {hps.map((hp) => {
                  const name =
                    hp.HPProfile?.name ??
                    `${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim();
                  return (
                    <SelectItem
                      key={hp.id}
                      value={String(hp.id)}
                      aria-label={`${hp.HPProfile?.title ? hp.HPProfile.title + " " : ""}${name}${hp.HPType?.name ? " - " + hp.HPType.name : ""}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                        {hp.HPProfile?.title ? `${hp.HPProfile.title} ` : ""}
                        {name}
                        {hp.HPType?.name && (
                          <span className="text-muted-foreground text-xs">· {hp.HPType.name}</span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs font-medium">
              Schedule Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="timeStart" className="text-xs font-medium">
                Time Start
              </Label>
              <Input
                id="timeStart"
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timeEnd" className="text-xs font-medium">
                Time End
              </Label>
              <Input
                id="timeEnd"
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary/90 hover:bg-primary" disabled={isPending}>
              {isPending ? "Confirming..." : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
