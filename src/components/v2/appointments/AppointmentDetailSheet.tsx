"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  User,
  CalendarDays,
  Clock,
  Stethoscope,
  Phone,
  Mail,
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import {
  completeAppointmentAction,
  rejectAppointmentAction,
} from "@/actions/appointments/appointment-attribute.action";
import {
  acceptAppointmentAction,
  declineAppointmentAction,
} from "@/actions/appointments/appointment-routing.action";
import { STATUS_CONFIG } from "./AppointmentCard";
import { ConfirmBookingSheet } from "./ConfirmBookingSheet";
import { AssignDoctorDialog } from "./AssignDoctorDialog";
import { PreAssessmentNoteDialog } from "./PreAssessmentNoteDialog";
import type { GetAppointmentModes } from "@/actions/appointments/appointment-mode.action";
import type { GetAppointmentTypes } from "@/actions/appointments/appointment-type.action";
import type { GetClinicServices } from "@/actions/clinics/clinic-service.action";
import type { GetHPsType } from "@/actions/hp.actions";

type Appointment = NonNullable<GetAppointments["data"]>[number];

interface AppointmentDetailSheetProps {
  clinicUid: string;
  appointment: Appointment | null;
  modes: GetAppointmentModes;
  types: GetAppointmentTypes;
  services: GetClinicServices;
  hps: GetHPsType;
  onClose: () => void;
  onRefresh: () => void;
}

export function AppointmentDetailSheet({
  clinicUid,
  appointment,
  modes,
  types,
  services,
  hps,
  onClose,
  onRefresh,
}: AppointmentDetailSheetProps) {
  const [isPending, setIsPending] = useState(false);
  const [showConfirmBooking, setShowConfirmBooking] = useState(false);
  const [showAssignDoctor, setShowAssignDoctor] = useState(false);
  const [showPreAssessment, setShowPreAssessment] = useState(false);

  if (!appointment) return null;

  const status = appointment.AppointmentAttribute?.status ?? "PENDING";
  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
  const requester = appointment.Requesters?.[0]?.User;
  const fullName = requester
    ? `${requester.firstName ?? ""} ${requester.middleName ? requester.middleName + " " : ""}${requester.lastName ?? ""}${requester.suffix ? " " + requester.suffix : ""}`.trim()
    : "Unknown Patient";
  const initials = `${requester?.firstName?.charAt(0) ?? ""}${requester?.lastName?.charAt(0) ?? ""}`;

  const scheduledDate = appointment.AppointmentAttribute?.date;
  const timeStart = appointment.AppointmentAttribute?.timeStart;
  const routings = appointment.AppointmentRouting ?? [];
  const activeRouting = routings.find((r) => r.status === "ACCEPTED" || r.status === "PENDING");

  const handleComplete = async () => {
    setIsPending(true);
    const fd = new FormData();
    fd.append("appointmentId", String(appointment.id));
    const result = await completeAppointmentAction(fd);
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      onRefresh();
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  const handleReject = async () => {
    setIsPending(true);
    const fd = new FormData();
    fd.append("appointmentId", String(appointment.id));
    fd.append("reason", "Rejected by clinic staff");
    const result = await rejectAppointmentAction(fd);
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      onRefresh();
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  const handleAcceptRouting = async (routingCode: string) => {
    setIsPending(true);
    const fd = new FormData();
    fd.append("routingCode", routingCode);
    const result = await acceptAppointmentAction(fd);
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      onRefresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleDeclineRouting = async (routingCode: string) => {
    setIsPending(true);
    const fd = new FormData();
    fd.append("routingCode", routingCode);
    fd.append("reason", "Declined by healthcare provider");
    const result = await declineAppointmentAction(fd);
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      onRefresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <Sheet open={!!appointment} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto" side="right">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Appointment Details
            </SheetTitle>
            <SheetDescription>
              Review and manage this appointment
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
            {/* Status badge */}
            <Badge className={`text-sm px-3 py-1 border-0 font-medium ${statusConfig.className}`}>
              {statusConfig.label}
            </Badge>

            {/* Patient Info */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Patient Information
              </h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-full border border-border/50">
                  <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                    {initials || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{fullName}</p>
                  {requester?.email && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{requester.email}</p>
                    </div>
                  )}
                  {requester?.mobile && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{requester.mobile}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Info */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Appointment Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Subject</span>
                  <p className="font-medium">{appointment.subject}</p>
                </div>
                {appointment.complaint && (
                  <div>
                    <span className="text-muted-foreground text-xs">Complaint</span>
                    <p className="text-sm">{appointment.complaint}</p>
                  </div>
                )}
                {appointment.AppointmentAttribute?.AppointmentType && (
                  <div>
                    <span className="text-muted-foreground text-xs">Type</span>
                    <p className="font-medium">{appointment.AppointmentAttribute.AppointmentType.name}</p>
                  </div>
                )}
                {appointment.AppointmentAttribute?.AppointmentMode && (
                  <div>
                    <span className="text-muted-foreground text-xs">Mode</span>
                    <p className="font-medium">{appointment.AppointmentAttribute.AppointmentMode.name}</p>
                  </div>
                )}
                {appointment.AppointmentAttribute?.Service && (
                  <div>
                    <span className="text-muted-foreground text-xs">Service</span>
                    <p className="font-medium">{appointment.AppointmentAttribute.Service.name}</p>
                  </div>
                )}
                {scheduledDate && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(scheduledDate), "MMMM d, yyyy")}</span>
                    {timeStart && (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{timeStart}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assignment History */}
            {routings.length > 0 && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Assignment History
                </h3>
                <div className="space-y-2">
                  {routings.map((routing) => {
                    const routingDoctorName =
                      routing.RoutedTo.HPProfile?.name ??
                      `${routing.RoutedTo.User.firstName ?? ""} ${routing.RoutedTo.User.lastName ?? ""}`.trim();
                    return (
                      <div
                        key={routing.id}
                        className="flex items-center justify-between text-sm rounded-lg bg-background/50 p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-xs">{routingDoctorName}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs border-0 ${
                            routing.status === "ACCEPTED"
                              ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                              : routing.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : routing.status === "DECLINED"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                          }`}
                        >
                          {routing.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                {status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-primary/90 hover:bg-primary"
                      disabled={isPending}
                      onClick={() => setShowConfirmBooking(true)}
                    >
                      <ClipboardList className="h-4 w-4" />
                      Confirm Booking
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={isPending}
                      onClick={handleReject}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {status === "RECEIVED" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-purple-400/40 text-purple-600 hover:bg-purple-600 hover:text-white"
                      disabled={isPending}
                      onClick={() => setShowAssignDoctor(true)}
                    >
                      <Stethoscope className="h-4 w-4" />
                      Assign Doctor
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={isPending}
                      onClick={handleReject}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {status === "ROUTED" && activeRouting && (
                  <>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                      disabled={isPending || !activeRouting.routingCode}
                      onClick={() => activeRouting.routingCode && handleAcceptRouting(activeRouting.routingCode)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accept Assignment
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={isPending || !activeRouting.routingCode}
                      onClick={() => activeRouting.routingCode && handleDeclineRouting(activeRouting.routingCode)}
                    >
                      <XCircle className="h-4 w-4" />
                      Decline Assignment
                    </Button>
                  </>
                )}
                {status === "ACCEPTED" && (
                  <>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                      disabled={isPending}
                      onClick={handleComplete}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={isPending}
                      onClick={() => setShowPreAssessment(true)}
                    >
                      <ClipboardList className="h-4 w-4" />
                      Add Pre-Assessment Note
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmBookingSheet
        open={showConfirmBooking}
        appointment={appointment}
        modes={modes}
        types={types}
        services={services}
        hps={hps}
        onClose={() => setShowConfirmBooking(false)}
        onSuccess={() => {
          setShowConfirmBooking(false);
          onRefresh();
          onClose();
        }}
      />

      <AssignDoctorDialog
        open={showAssignDoctor}
        appointment={appointment}
        hps={hps}
        onClose={() => setShowAssignDoctor(false)}
        onSuccess={() => {
          setShowAssignDoctor(false);
          onRefresh();
          onClose();
        }}
      />

      <PreAssessmentNoteDialog
        open={showPreAssessment}
        appointmentId={appointment.id}
        clinicUid={clinicUid}
        onClose={() => setShowPreAssessment(false)}
        onSuccess={() => {
          setShowPreAssessment(false);
          onRefresh();
        }}
      />
    </>
  );
}
