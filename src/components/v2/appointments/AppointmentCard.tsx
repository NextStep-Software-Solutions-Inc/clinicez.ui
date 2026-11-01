"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarClock,
  User,
  Stethoscope,
  CheckCircle,
  ClipboardList,
  Lock,
  UserCheck,
  Tags,
  AlertTriangle,
  X,
  Paperclip,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import {
  receiveAppointmentAction,
  completeAppointmentAction,
  rejectAppointmentAction,
} from "@/actions/appointments/appointment-attribute.action";
import { isWalkInAppointment, getAppointmentPatientName, getAppointmentInitials } from "./appointment-utils";
import { formatPhilHealthPinDisplay } from "@/lib/philhealth-pin-search";

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
  DROPPED: {
    label: "Dropped",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400",
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
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const status = appointment.AppointmentAttribute?.status ?? "PENDING";
  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;

  const isWalkIn = isWalkInAppointment(appointment);
  const fullName = getAppointmentPatientName(appointment);
  const displaySubject = isWalkIn ? appointment.complaint ?? "" : appointment.subject;
  const initials = getAppointmentInitials(appointment);
  const patientPicture = appointment.Requesters?.[0]?.User?.picture ?? null;
  const studentRecord = appointment.Requesters?.[0]?.User?.StudentRecords?.[0];
  const employmentRecord = appointment.Requesters?.[0]?.User?.UserEmployments?.[0];
  const studentId = studentRecord?.studentId;
  const employeeId = employmentRecord?.employeeId;
  const rawPhilHealthPin = appointment.Requesters?.[0]?.User?.PhilHealthRecords?.[0]?.pin;
  const philHealthPin = rawPhilHealthPin ? formatPhilHealthPinDisplay(rawPhilHealthPin) : null;

  const studentAffiliation = [
    studentRecord?.Program?.name,
    studentRecord?.College?.name,
    studentRecord?.Department?.name,
    studentRecord?.yearLevel ? `Yr ${studentRecord.yearLevel}` : null,
  ].filter(Boolean).join(" • ") || studentRecord?.Organization?.name || "";

  const employeeAffiliation = [
    employmentRecord?.position || employmentRecord?.designation,
    employmentRecord?.Department?.name,
    employmentRecord?.Office?.name,
    employmentRecord?.College?.name,
  ].filter(Boolean).join(" • ") || employmentRecord?.Organization?.name || "";

  const activeRouting = appointment.AppointmentRouting?.find(
    (r) => r.status === "ACCEPTED" || r.status === "PENDING"
  );
  const assignedDoctor = activeRouting?.RoutedTo;
  const doctorName =
    assignedDoctor?.HPProfile?.name ??
    (assignedDoctor?.User
      ? `${assignedDoctor.User.firstName ?? ""} ${assignedDoctor.User.lastName ?? ""}`.trim()
      : null);

  // Tagged HP names
  const taggedHps = appointment.AppointmentTag ?? [];

  // Attachment count
  const attachmentCount = appointment.AppointmentAttachments?.length ?? 0;

  // ── Handlers (no stopPropagation needed — actions area is outside the click zone) ──

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
    } else {
      toast.error(result.message);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error("A reason is required to reject this appointment.");
      return;
    }
    setIsPending(true);
    const fd = new FormData();
    fd.append("appointmentId", String(appointment.id));
    fd.append("reason", rejectReason.trim());
    const result = await rejectAppointmentAction(fd);
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      setShowRejectForm(false);
      setRejectReason("");
      onRefresh();
    } else {
      toast.error(result.message);
    }
  };

  // For regular appointments, show complaint separately from subject
  const chiefComplaint = !isWalkIn ? appointment.complaint : null;

  return (
    <div
      className="flex flex-col rounded-xl border border-white/30 dark:border-slate-700/30 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: "hsl(var(--primary) / 0.25)" }}
    >
      {/* ── Main row ────────────────────────────────────────────────────────── */}
      <div className="flex items-stretch gap-0">
        {/* ── Clickable info area ──────────────────────────────────────────── */}
        <button
          type="button"
          className="flex flex-1 flex-col px-4 py-3 text-left group hover:bg-white/30 dark:hover:bg-slate-700/30 transition-colors min-w-0"
          onClick={() => onSelect(appointment)}
        >
          {/* ── Top row: badges + date ──────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-2 w-full mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className={`text-xs px-2 py-0.5 border-0 font-medium ${statusConfig.className}`}>
                {statusConfig.label}
              </Badge>
              {isWalkIn && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 border-primary/30 text-primary gap-1">
                  <UserCheck className="h-2.5 w-2.5" />
                  Walk-In
                </Badge>
              )}
              {appointment.AppointmentAttribute?.AppointmentType && (
                <span className="text-xs text-muted-foreground/60 hidden sm:inline">
                  {appointment.AppointmentAttribute.AppointmentType.name}
                </span>
              )}
              {attachmentCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground/70" title={`${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`}>
                  <Paperclip className="h-3 w-3" />
                  {attachmentCount}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <CalendarClock className="h-3 w-3" />
                {formatDistanceToNow(new Date(appointment.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* ── Subject: primary/prominent ───────────────────────────────────── */}
          {displaySubject && (
            <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {displaySubject}
            </p>
          )}

          {/* ── Chief complaint: secondary, up to 2 lines ────────────────────── */}
          {chiefComplaint && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {chiefComplaint}
            </p>
          )}

          {/* ── Patient + meta row ───────────────────────────────────────────── */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5 rounded-full border border-white/50 dark:border-slate-600/50 flex-shrink-0">
                {patientPicture && (
                  <AvatarImage src={patientPicture} alt={fullName} className="object-cover" />
                )}
                <AvatarFallback className="text-[0.5rem] font-semibold bg-primary/10 text-primary">
                  {initials || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground font-bold">{fullName}</span>
              {philHealthPin && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 font-normal bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  title="PhilHealth Identification Number (PIN)"
                >
                  PIN: {philHealthPin}
                </Badge>
              )}
              {studentId && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 font-normal bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                  title={studentAffiliation || "Student ID"}
                >
                  STU: {studentId}
                </Badge>
              )}
              {employeeId && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 font-normal bg-purple-50/80 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                  title={employeeAffiliation || "Employee ID"}
                >
                  EMP: {employeeId}
                </Badge>
              )}
            </div>
            {doctorName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Stethoscope className="h-3 w-3" />
                {doctorName}
              </span>
            )}
            {taggedHps.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
                <Tags className="h-3 w-3" />
                {taggedHps
                  .map((t) => {
                    const hp = t.HealthcareProvider;
                    return (
                      hp.HPProfile?.name ??
                      `${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim()
                    );
                  })
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}
          </div>
        </button>

        {/* ── Actions area (NOT inside the clickable zone) ───────────────── */}
        <div className="hidden md:flex flex-col items-end gap-1.5 flex-shrink-0 px-3 py-3 self-center">
          <div className="flex flex-wrap gap-1.5 justify-end">
          {status === "PENDING" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                disabled={isPending}
                onClick={handleReceive}
              >
                <Lock className="h-3 w-3 mr-1" />
                Receive
              </Button>
              {!showRejectForm && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isPending}
                  onClick={() => setShowRejectForm(true)}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              )}
            </>
          )}
          {status === "RECEIVED" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-teal-400/40 text-teal-700 hover:bg-teal-600 hover:text-white"
              disabled={isPending}
              onClick={() => onSelect(appointment)}
            >
              <ClipboardList className="h-3 w-3 mr-1" />
              Manage
            </Button>
          )}
          {status === "ROUTED" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-purple-400/40 text-purple-600 hover:bg-purple-600 hover:text-white"
              disabled={isPending}
              onClick={() => onSelect(appointment)}
            >
              <Stethoscope className="h-3 w-3 mr-1" />
              View &amp; Act
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
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={isPending}
                onClick={() => onSelect(appointment)}
              >
                <ClipboardList className="h-3 w-3 mr-1" />
                Pre-Assess
              </Button>
            </>
          )}
          {(status === "COMPLETED" || status === "REJECTED" || status === "DROPPED") && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => onSelect(appointment)}
            >
              View Details
            </Button>
          )}
          </div>
        </div>
      </div>

      {/* ── Inline reject form (shown below the main row) ─────────────────── */}
      {showRejectForm && (
        <div className="mx-4 mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-destructive uppercase tracking-wide">
              Reject Appointment
            </h4>
            <button
              type="button"
              onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={2}
              className="resize-none text-xs"
              disabled={isPending}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs"
              disabled={isPending}
              onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 h-7 text-xs gap-1"
              disabled={isPending || !rejectReason.trim()}
              onClick={handleRejectSubmit}
            >
              <AlertTriangle className="h-3 w-3" />
              {isPending ? "Rejecting…" : "Confirm Reject"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
