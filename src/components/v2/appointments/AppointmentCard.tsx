"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  CheckCircle,
  ClipboardList,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import {
  completeAppointmentAction,
  rejectAppointmentAction,
} from "@/actions/appointments/appointment-attribute.action";

type Appointment = NonNullable<GetAppointments["data"]>[number];

export const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  RECEIVED: {
    label: "Received",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  ROUTED: {
    label: "Routed",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
} as const;

interface AppointmentCardProps {
  appointment: Appointment;
  onSelect: (appointment: Appointment) => void;
  onRefresh: () => void;
}

export function AppointmentCard({
  appointment,
  onSelect,
  onRefresh,
}: AppointmentCardProps) {
  const [isPending, setIsPending] = useState(false);

  const status = appointment.AppointmentAttribute?.status ?? "PENDING";
  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;

  const requester = appointment.Requesters?.[0]?.User;
  const fullName = requester
    ? `${requester.firstName ?? ""} ${requester.middleName ? requester.middleName + " " : ""}${requester.lastName ?? ""}${requester.suffix ? " " + requester.suffix : ""}`.trim()
    : "Unknown Patient";
  const initials = `${requester?.firstName?.charAt(0) ?? ""}${requester?.lastName?.charAt(0) ?? ""}`;

  const scheduledDate = appointment.AppointmentAttribute?.date;
  const timeStart = appointment.AppointmentAttribute?.timeStart;
  const activeRouting = appointment.AppointmentRouting?.find(
    (r) => r.status === "ACCEPTED" || r.status === "PENDING"
  );
  const assignedDoctor = activeRouting?.RoutedTo;
  const doctorName =
    assignedDoctor?.HPProfile?.name ??
    (assignedDoctor?.User
      ? `${assignedDoctor.User.firstName ?? ""} ${assignedDoctor.User.lastName ?? ""}`.trim()
      : null);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPending(true);
    const fd = new FormData();
    fd.append("appointmentId", String(appointment.id));
    const result = await completeAppointmentAction(fd);
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      onRefresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPending(true);
    const fd = new FormData();
    fd.append("appointmentId", String(appointment.id));
    fd.append("reason", "Rejected by clinic staff");
    const result = await rejectAppointmentAction(fd);
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      onRefresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(appointment)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(appointment)}
      className="group flex items-start gap-3 sm:gap-4 px-4 py-3 rounded-xl border border-white/30 dark:border-slate-700/30 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-white/40 dark:hover:bg-slate-700/40 transition-all duration-200 cursor-pointer"
      style={{ borderLeftWidth: 4, borderLeftColor: "hsl(var(--primary) / 0.25)" }}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 rounded-full border border-white/50 dark:border-slate-600/50 flex-shrink-0 mt-0.5">
        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
          {initials || <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {fullName}
          </p>
          <Badge className={`text-xs px-2 py-0.5 border-0 font-medium ${statusConfig.className}`}>
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {appointment.subject}
        </p>
        {appointment.complaint && (
          <p className="text-xs text-muted-foreground/70 line-clamp-1">
            {appointment.complaint}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {scheduledDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(scheduledDate), "MMM d, yyyy")}
            </span>
          )}
          {timeStart && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeStart}
            </span>
          )}
          {doctorName && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Stethoscope className="h-3 w-3" />
              {doctorName}
            </span>
          )}
          {appointment.AppointmentAttribute?.AppointmentType && (
            <span className="text-xs text-muted-foreground/60">
              {appointment.AppointmentAttribute.AppointmentType.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "PENDING" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(appointment);
            }}
          >
            <ClipboardList className="h-3 w-3 mr-1" />
            Confirm Booking
          </Button>
        )}
        {status === "RECEIVED" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-purple-400/40 text-purple-600 hover:bg-purple-600 hover:text-white"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(appointment);
            }}
          >
            <Stethoscope className="h-3 w-3 mr-1" />
            Assign Doctor
          </Button>
        )}
        {status === "ROUTED" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-purple-400/40 text-purple-600 hover:bg-purple-600 hover:text-white"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(appointment);
            }}
          >
            <Stethoscope className="h-3 w-3 mr-1" />
            View & Act
          </Button>
        )}
        {status === "ACCEPTED" && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-green-400/40 text-green-600 hover:bg-green-600 hover:text-white"
              disabled={isPending}
              onClick={handleComplete}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={isPending}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(appointment);
              }}
            >
              <ClipboardList className="h-3 w-3 mr-1" />
              Pre-Assessment
            </Button>
          </>
        )}
        {(status === "COMPLETED" || status === "REJECTED") && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(appointment);
            }}
          >
            View Details
          </Button>
        )}
        {status === "PENDING" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={handleReject}
          >
            Reject
          </Button>
        )}
      </div>
    </div>
  );
}
