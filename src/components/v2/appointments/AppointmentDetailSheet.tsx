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
  Tags,
  Lock,
  UserCheck,
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
  receiveAppointmentAction,
  completeAppointmentAction,
  rejectAppointmentAction,
} from "@/actions/appointments/appointment-attribute.action";
import {
  acceptAppointmentAction,
  declineAppointmentAction,
} from "@/actions/appointments/appointment-routing.action";
import { STATUS_CONFIG } from "./AppointmentCard";
import { isWalkInAppointment, getAppointmentPatientName, getAppointmentInitials } from "./appointment-utils";

type Appointment = NonNullable<GetAppointments["data"]>[number];
type SubPanel = "confirm" | "assign" | "preAssessment" | "tag";

interface AppointmentDetailSheetProps {
  appointment: Appointment | null;
  currentUserHpIds: number[];
  onClose: () => void;
  onRefresh: () => void;
  onOpenSubPanel: (panel: SubPanel) => void;
}

export function AppointmentDetailSheet({
  appointment,
  currentUserHpIds,
  onClose,
  onRefresh,
  onOpenSubPanel,
}: AppointmentDetailSheetProps) {
  const [isPending, setIsPending] = useState(false);

  if (!appointment) return null;

  const status = appointment.AppointmentAttribute?.status ?? "PENDING";
  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;

  const requester = appointment.Requesters?.[0]?.User;
  const isWalkIn = isWalkInAppointment(appointment);
  const fullName = getAppointmentPatientName(appointment);
  const initials = getAppointmentInitials(appointment);

  const scheduledDate = appointment.AppointmentAttribute?.date;
  const timeStart = appointment.AppointmentAttribute?.timeStart;
  const routings = appointment.AppointmentRouting ?? [];
  // Show only the most recent PENDING or ACCEPTED routing
  const activeRouting = routings.find((r) => r.status === "ACCEPTED" || r.status === "PENDING");

  const receivedBy = appointment.AppointmentAttribute?.ReceivedBy;
  const receivedByName = receivedBy
    ? `${receivedBy.firstName ?? ""} ${receivedBy.lastName ?? ""}`.trim()
    : null;

  // Accept/Decline guard: only the assigned HP can accept or decline
  const isAssignedToCurrentUser =
    !!activeRouting && currentUserHpIds.includes(activeRouting.RoutedTo.id);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleReceive = async () => {
    setIsPending(true);
    const fd = new FormData();
    fd.append("appointmentId", String(appointment.id));
    fd.append("status", "RECEIVED");
    const result = await receiveAppointmentAction(fd);
    setIsPending(false);
    if (result.status) {
      toast.success("Appointment received and locked to you.");
      onRefresh();
    } else {
      toast.error(result.message);
    }
  };

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
          {/* Status + lock info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-sm px-3 py-1 border-0 font-medium ${statusConfig.className}`}>
              {statusConfig.label}
            </Badge>
            {isWalkIn && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary gap-1">
                <UserCheck className="h-3 w-3" />
                Walk-In
              </Badge>
            )}
            {receivedByName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Received by {receivedByName}
              </span>
            )}
          </div>

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
              {!isWalkIn && (
                <div>
                  <span className="text-muted-foreground text-xs">Subject</span>
                  <p className="font-medium">{appointment.subject}</p>
                </div>
              )}
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

          {/* Tagged HPs */}
          {(appointment.AppointmentTag ?? []).length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tagged Providers
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {appointment.AppointmentTag.map((tag) => {
                  const hp = tag.HealthcareProvider;
                  const name = hp.HPProfile?.name ??
                    `${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim();
                  return (
                    <Badge key={tag.id} variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                      <Stethoscope className="h-3 w-3" />
                      {hp.HPProfile?.title ? `${hp.HPProfile.title} ` : ""}{name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

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

              {/* PENDING: Receive (lock) + Reject */}
              {status === "PENDING" && (
                <>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-primary/90 hover:bg-primary"
                    disabled={isPending}
                    onClick={handleReceive}
                  >
                    <Lock className="h-4 w-4" />
                    Receive &amp; Lock
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

              {/* RECEIVED: Pre-Assess, Assign Doctor (first), Confirm Booking, Tag HPs, Complete, Reject */}
              {status === "RECEIVED" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-teal-400/40 text-teal-700 hover:bg-teal-600 hover:text-white"
                    disabled={isPending}
                    onClick={() => onOpenSubPanel("preAssessment")}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Pre-Assessment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-purple-400/40 text-purple-600 hover:bg-purple-600 hover:text-white"
                    disabled={isPending}
                    onClick={() => onOpenSubPanel("assign")}
                  >
                    <Stethoscope className="h-4 w-4" />
                    Assign Doctor
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-primary/90 hover:bg-primary"
                    disabled={isPending}
                    onClick={() => onOpenSubPanel("confirm")}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Confirm Booking
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-blue-400/40 text-blue-600 hover:bg-blue-600 hover:text-white"
                    disabled={isPending}
                    onClick={() => onOpenSubPanel("tag")}
                  >
                    <Tags className="h-4 w-4" />
                    Tag Providers
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    disabled={isPending}
                    onClick={handleComplete}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Complete
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

              {/* ROUTED: Accept/Decline (assigned user only) + Reassign */}
              {status === "ROUTED" && activeRouting && (
                <>
                  {isAssignedToCurrentUser ? (
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
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Only the assigned provider can accept or decline this assignment.
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-purple-400/40 text-purple-600 hover:bg-purple-600 hover:text-white"
                    disabled={isPending}
                    onClick={() => onOpenSubPanel("assign")}
                  >
                    <Stethoscope className="h-4 w-4" />
                    Reassign Doctor
                  </Button>
                </>
              )}

              {/* ACCEPTED: Pre-Assess + Complete */}
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
                    onClick={() => onOpenSubPanel("preAssessment")}
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
  );
}
