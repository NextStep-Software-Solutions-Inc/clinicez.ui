"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Stethoscope, Video, CalendarPlus, Info, AlertTriangle, ExternalLink } from "lucide-react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { confirmAppointmentBookingAction } from "@/actions/appointments/appointment-attribute.action";
import { insertToCalendar, checkGoogleCalendarAccess } from "@/actions/google/auth.action";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import type { GetAppointmentModes } from "@/actions/appointments/appointment-mode.action";
import type { GetAppointmentTypes } from "@/actions/appointments/appointment-type.action";
import type { GetClinicServiceCategories } from "@/actions/clinics/clinic-service-category.action";
import type { GetHPsType } from "@/actions/hp.actions";
import type { GetSystems } from "@/actions/system.action";

type Appointment = NonNullable<GetAppointments["data"]>[number];

interface ConfirmBookingSheetProps {
  open: boolean;
  appointment: Appointment;
  modes: GetAppointmentModes;
  types: GetAppointmentTypes;
  serviceCategories: GetClinicServiceCategories;
  hps: GetHPsType;
  systems: NonNullable<GetSystems>;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfirmBookingSheet({
  open,
  appointment,
  modes,
  types,
  serviceCategories,
  hps,
  systems,
  onClose,
  onSuccess,
}: ConfirmBookingSheetProps) {
  const [isPending, setIsPending] = useState(false);
  const [modeId, setModeId] = useState<string>("");
  const [typeId, setTypeId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [hpId, setHpId] = useState<string>("");
  const [systemId, setSystemId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");

  // Google Calendar state
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [createMeet, setCreateMeet] = useState(false);

  // Detect if selected mode is virtual
  const selectedMode = modes.find(m => String(m.id) === modeId);
  const isVirtualMode = selectedMode
    ? selectedMode.name.toUpperCase().includes("VIRTUAL")
    : false;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    checkGoogleCalendarAccess().then(({ connected }) => {
      if (!cancelled) setGoogleConnected(connected);
    }).catch(() => {
      if (!cancelled) setGoogleConnected(false);
    });
    return () => { cancelled = true; };
  }, [open]);

  // Auto-enable Meet for virtual mode when calendar is on
  useEffect(() => {
    if (isVirtualMode && addToCalendar) {
      setCreateMeet(true);
    }
  }, [isVirtualMode, addToCalendar]);

  const handleConnectGoogle = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    window.open(`${baseUrl}/settings/integrations`, "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modeId || !typeId || !serviceId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (timeStart && timeEnd && timeEnd <= timeStart) {
      toast.error("End time must be later than start time.");
      return;
    }

    setIsPending(true);
    const result = await confirmAppointmentBookingAction({
      appointmentId: appointment.id,
      modeId: parseInt(modeId),
      typeId: parseInt(typeId),
      serviceId: parseInt(serviceId),
      hpId: hpId ? parseInt(hpId) : undefined,
      systemId: systemId ? parseInt(systemId) : undefined,
      date: date ? new Date(date) : undefined,
      timeStart: timeStart || undefined,
      timeEnd: timeEnd || undefined,
    });

    if (!result.status) {
      setIsPending(false);
      toast.error(result.message);
      return;
    }

    // Optionally create Google Calendar event
    if (addToCalendar && googleConnected) {
      const calResult = await insertToCalendar(appointment.id, createMeet);
      if (calResult.status) {
        toast.success(`${result.message} — Event added to Google Calendar.`);
      } else {
        toast.success(result.message);
        toast.warning(`Booking confirmed but calendar event failed: ${calResult.message}`);
      }
    } else {
      toast.success(result.message);
    }

    setIsPending(false);
    onSuccess();
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
                {serviceCategories.map((category) => (
                  <SelectGroup key={category.id}>
                    <SelectLabel>{category.name}</SelectLabel>
                    {category.Services.map((service) => (
                      <SelectItem key={service.id} value={String(service.id)}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System / Department (optional) */}
          {systems.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="system" className="text-xs font-medium">
                System / Department <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Select value={systemId} onValueChange={setSystemId}>
                <SelectTrigger id="system">
                  <SelectValue placeholder="Select system (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {systems.map((system) => (
                    <SelectItem key={system.id} value={String(system.id)}>
                      {system.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assign Healthcare Provider (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="hp" className="text-xs font-medium">
              Assign Healthcare Provider <span className="text-muted-foreground font-normal">(optional — routes immediately)</span>
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

          {/* Google Calendar Section */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">Google Calendar</span>
            </div>

            {googleConnected === null && (
              <p className="text-xs text-muted-foreground">Checking integration status…</p>
            )}

            {googleConnected === false && (
              <Alert className="py-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">
                  Google Calendar is not connected.{" "}
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    className="underline font-medium inline-flex items-center gap-1"
                  >
                    Connect now <ExternalLink className="h-3 w-3" />
                  </button>{" "}
                  to add events automatically.
                </AlertDescription>
              </Alert>
            )}

            {googleConnected === true && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="addToCalendar" className="text-xs cursor-pointer">
                    Add event to Google Calendar
                  </Label>
                  <Switch
                    id="addToCalendar"
                    checked={addToCalendar}
                    onCheckedChange={setAddToCalendar}
                  />
                </div>

                {addToCalendar && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="createMeet" className="text-xs cursor-pointer flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-purple-500" />
                        {isVirtualMode ? "Create Google Meet link (virtual)" : "Create Google Meet link (optional)"}
                      </Label>
                      <Switch
                        id="createMeet"
                        checked={createMeet}
                        onCheckedChange={setCreateMeet}
                      />
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        This will add the appointment to both the provider&apos;s and patient&apos;s Google Calendar.
                        {createMeet && " A Google Meet link will be sent to all attendees."}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
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
