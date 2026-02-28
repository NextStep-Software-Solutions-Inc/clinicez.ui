"use client";

import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Pencil,
  CalendarClock,
  Undo2,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import {
  receiveAppointmentAction,
  completeAppointmentAction,
  rejectAppointmentAction,
  cancelAppointmentAction,
  returnAppointmentAction,
} from "@/actions/appointments/appointment-attribute.action";
import {
  acceptAppointmentAction,
  declineAppointmentAction,
  cancelAppointmentRoutingAction,
} from "@/actions/appointments/appointment-routing.action";
import {
  getPreAssessmentNotesAction,
  type GetPreAssessmentNotes,
} from "@/actions/appointments/pre-assessment-note.action";
import { STATUS_CONFIG } from "./AppointmentCard";
import { isWalkInAppointment, getAppointmentPatientName, getAppointmentInitials } from "./appointment-utils";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { AddVitalsDialog } from "./AddVitalsDialog";

type Appointment = NonNullable<GetAppointments["data"]>[number];
type SubPanel = "confirm" | "assign" | "preAssessment" | "tag" | "reschedule";
type PreAssessmentNote = NonNullable<NonNullable<GetPreAssessmentNotes["data"]>[number]>;

interface AppointmentDetailSheetProps {
  appointment: Appointment | null;
  clinicUid: string;
  currentUserHpIds: number[];
  currentUserSub?: string;
  onClose: () => void;
  onRefresh: () => void;
  onOpenSubPanel: (panel: SubPanel) => void;
  onEditPreAssessmentNote?: (note: { assessment: string; homeInstructions?: string | null; remarks: string }) => void;
}

export function AppointmentDetailSheet({
  appointment,
  clinicUid,
  currentUserHpIds,
  currentUserSub,
  onClose,
  onRefresh,
  onOpenSubPanel,
  onEditPreAssessmentNote,
}: AppointmentDetailSheetProps) {
  const [isPending, setIsPending] = useState(false);

  // Inline reject reason state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Inline decline reason state
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [decliningRoutingCode, setDecliningRoutingCode] = useState<string | null>(null);

  // Inline cancel routing reason state (assigner cancels individual assignment)
  const [cancellingRoutingId, setCancellingRoutingId] = useState<number | null>(null);
  const [cancelRoutingReason, setCancelRoutingReason] = useState("");

  // Inline return-to-queue form state
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  // Pre-assessment notes state
  const [preAssessmentNotes, setPreAssessmentNotes] = useState<PreAssessmentNote[]>([]);
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Fetch pre-assessment notes when appointment changes
  useEffect(() => {
    if (!appointment) {
      setPreAssessmentNotes([]);
      return;
    }
    getPreAssessmentNotesAction(appointment.id).then((result) => {
      if (result.status && result.data) {
        setPreAssessmentNotes(result.data as PreAssessmentNote[]);
      } else {
        setPreAssessmentNotes([]);
      }
    });
  }, [appointment]);

  // Reset inline forms when appointment changes
  useEffect(() => {
    setShowRejectForm(false);
    setRejectReason("");
    setShowDeclineForm(false);
    setDeclineReason("");
    setDecliningRoutingCode(null);
    setCancellingRoutingId(null);
    setCancelRoutingReason("");
    setShowReturnForm(false);
    setReturnReason("");
  }, [appointment]);

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
  // Pending routing for accept/decline (only PENDING — not ACCEPTED)
  const pendingRouting = routings.find((r) => r.status === "PENDING");
  // Accepted routing (HP already accepted the assignment)
  const acceptedRouting = routings.find((r) => r.status === "ACCEPTED");

  const receivedBy = appointment.AppointmentAttribute?.ReceivedBy;
  const receivedByName = receivedBy
    ? `${receivedBy.firstName ?? ""} ${receivedBy.lastName ?? ""}`.trim()
    : null;

  // Accept/Decline guard: only the assigned HP, and only when routing is PENDING
  const isAssignedToCurrentUser =
    !!pendingRouting && currentUserHpIds.includes(pendingRouting.RoutedTo.id);
  // True if current user is the accepted catering HP (routing must be ACCEPTED)
  const isAcceptedCateringHP =
    !!acceptedRouting && currentUserHpIds.includes(acceptedRouting.RoutedTo.id);
  // True if current user is the receiver
  const isReceiver =
    !!currentUserSub && appointment.AppointmentAttribute?.ReceivedBy?.userId === currentUserSub;
  // True if current user is any assigner (RoutedBy) across all routings
  const isAssigner =
    !!currentUserSub && routings.some((r) => r.RoutedBy?.userId === currentUserSub);
  // Mark Complete on ROUTED: accepted HP, receiver, or assigner
  const canCompleteRouted = isAcceptedCateringHP || isReceiver || isAssigner;

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

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error(status === "PENDING" ? "A reason is required to reject this appointment." : "A reason is required to cancel this appointment.");
      return;
    }
    setIsPending(true);
    const fd = new FormData();
    fd.append("appointmentId", String(appointment.id));
    fd.append("reason", rejectReason.trim());
    const result = status === "PENDING"
      ? await rejectAppointmentAction(fd)
      : await cancelAppointmentAction(fd);
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      onRefresh();
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  const handleReturnSubmit = async () => {
    if (!returnReason.trim()) {
      toast.error("A reason is required to return this appointment.");
      return;
    }
    setIsPending(true);
    const fd = new FormData();
    fd.append("appointmentId", String(appointment.id));
    fd.append("reason", returnReason.trim());
    const result = await returnAppointmentAction(fd);
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

  const handleDeclineSubmit = async () => {
    if (!declineReason.trim()) {
      toast.error("A reason is required to decline this assignment.");
      return;
    }
    if (!decliningRoutingCode) return;
    setIsPending(true);
    const fd = new FormData();
    fd.append("routingCode", decliningRoutingCode);
    fd.append("reason", declineReason.trim());
    const result = await declineAppointmentAction(fd);
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      setShowDeclineForm(false);
      setDeclineReason("");
      setDecliningRoutingCode(null);
      onRefresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleCancelRoutingSubmit = async () => {
    if (!cancelRoutingReason.trim()) {
      toast.error("A reason is required to cancel this assignment.");
      return;
    }
    if (!cancellingRoutingId) return;
    setIsPending(true);
    const result = await cancelAppointmentRoutingAction({ appointmentRoutingId: cancellingRoutingId, reason: cancelRoutingReason.trim() });
    setIsPending(false);
    if (result.status) {
      toast.success("Assignment cancelled.");
      setCancellingRoutingId(null);
      setCancelRoutingReason("");
      onRefresh();
    } else {
      toast.error(result.message);
    }
  };

  // Whether pre-assessment actions should be shown
  const canAccessPreAssessment = ["RECEIVED", "ROUTED", "ACCEPTED", "COMPLETED"].includes(status);

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
                {requester?.picture && (
                  <AvatarImage src={requester.picture} alt={fullName} className="object-cover" />
                )}
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
            {!isWalkIn && requester?.id && (
              <div className="flex items-center gap-3">
                <a
                  href={`/v2/clinic/${clinicUid}/patients/${requester.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Patient Profile
                </a>
                {requester.userId && (
                  <AddVitalsDialog patientUserId={requester.userId} />
                )}
              </div>
            )}
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

          {/* Pre-Assessment Notes — visible if notes exist or user can add */}
          {canAccessPreAssessment && (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <button
                type="button"
                className="w-full flex items-center justify-between text-left"
                onClick={() => setNotesExpanded((v) => !v)}
              >
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Pre-Assessment Notes
                  {preAssessmentNotes.length > 0 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 border-teal-400/40 text-teal-700">
                      {preAssessmentNotes.length}
                    </Badge>
                  )}
                </h3>
                {notesExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>

              {notesExpanded && (
                <div className="space-y-3 pt-1">
                  {preAssessmentNotes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No pre-assessment notes yet.</p>
                  ) : (
                    <>{preAssessmentNotes.map((note) => {
                      const author = `${note.CreatedBy?.firstName ?? ""} ${note.CreatedBy?.lastName ?? ""}`.trim() || "Staff";
                      const isMyNote = currentUserSub && note.CreatedBy?.userId === currentUserSub;
                      return (
                        <div key={note.id} className="rounded-lg bg-background/60 p-3 space-y-1.5 border border-border/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-primary">{author}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}
                              </span>
                              {isMyNote && status !== "COMPLETED" && status !== "REJECTED" && onEditPreAssessmentNote && (
                                <button
                                  type="button"
                                  onClick={() => onEditPreAssessmentNote({
                                    assessment: note.assessment,
                                    homeInstructions: note.homeInstructions,
                                    remarks: note.remarks ?? "",
                                  })}
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                  title="Edit your note"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Assessment</p>
                            <MarkdownRenderer content={note.assessment} className="text-sm" />
                          </div>
                          {note.homeInstructions && (
                            <div>
                              <p className="text-xs text-muted-foreground">Home Instructions</p>
                              <MarkdownRenderer content={note.homeInstructions} className="text-sm" />
                            </div>
                          )}
                          {note.remarks && (
                            <div>
                              <p className="text-xs text-muted-foreground">Remarks</p>
                              <MarkdownRenderer content={note.remarks} className="text-sm" />
                            </div>
                          )}
                        </div>
                      );
                    })}</>
                  )}
                  {status !== "COMPLETED" && status !== "REJECTED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-teal-400/40 text-teal-700 hover:bg-teal-600 hover:text-white w-full"
                      onClick={() => onOpenSubPanel("preAssessment")}
                    >
                      <ClipboardList className="h-4 w-4" />
                      {preAssessmentNotes.length > 0 ? "Add Another Note" : "Add Pre-Assessment Note"}
                    </Button>
                  )}
                </div>
              )}
              {!notesExpanded && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 w-full text-teal-700 hover:text-teal-800 hover:bg-teal-50"
                  onClick={() => {
                    setNotesExpanded(true);
                    if (preAssessmentNotes.length === 0 && status !== "COMPLETED" && status !== "REJECTED") {
                      onOpenSubPanel("preAssessment");
                    }
                  }}
                >
                  <ClipboardList className="h-3 w-3" />
                  {preAssessmentNotes.length > 0
                    ? `View ${preAssessmentNotes.length} note${preAssessmentNotes.length === 1 ? "" : "s"}`
                    : "Add Pre-Assessment Note"}
                </Button>
              )}
            </div>
          )}

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
                  const isMyPendingRouting =
                    routing.status === "PENDING" &&
                    !!currentUserSub &&
                    routing.RoutedBy?.userId === currentUserSub;
                  const isCancellingThis = cancellingRoutingId === routing.id;
                  return (
                    <div key={routing.id} className="rounded-lg bg-background/50 p-2 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-xs">{routingDoctorName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
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
                          {isMyPendingRouting && !isCancellingThis && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1.5 text-xs text-destructive hover:bg-destructive/10"
                              disabled={isPending}
                              onClick={() => { setCancellingRoutingId(routing.id); setCancelRoutingReason(""); }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Show cancellation/decline reason */}
                      {routing.amendment && (
                        <p className="text-xs text-muted-foreground pl-5 italic">{routing.amendment}</p>
                      )}
                      {/* Inline cancel reason form */}
                      {isCancellingThis && (
                        <div className="pt-1 space-y-2">
                          <Textarea
                            placeholder="Reason for cancelling this assignment…"
                            value={cancelRoutingReason}
                            onChange={(e) => setCancelRoutingReason(e.target.value)}
                            className="min-h-[60px] text-xs"
                            disabled={isPending}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-7"
                              disabled={isPending || !cancelRoutingReason.trim()}
                              onClick={handleCancelRoutingSubmit}
                            >
                              {isPending ? "Cancelling…" : "Confirm Cancel"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              disabled={isPending}
                              onClick={() => { setCancellingRoutingId(null); setCancelRoutingReason(""); }}
                            >
                              Back
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Actions
            </h3>
            <div className="flex flex-wrap gap-2">

              {/* PENDING: Receive (lock) + Reject (no tagging while pending) */}
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
                  {!showRejectForm && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={isPending}
                      onClick={() => setShowRejectForm(true)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Reject
                    </Button>
                  )}
                </>
              )}

              {/* RECEIVED: Assign Doctor (first), Confirm Booking, Tag HPs, Complete, Cancel */}
              {status === "RECEIVED" && (
                <>
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
                  {!showRejectForm && !showReturnForm && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={isPending}
                      onClick={() => setShowRejectForm(true)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                  {!showRejectForm && !showReturnForm && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-orange-400/40 text-orange-600 hover:bg-orange-600 hover:text-white"
                      disabled={isPending}
                      onClick={() => setShowReturnForm(true)}
                    >
                      <Undo2 className="h-4 w-4" />
                      Return
                    </Button>
                  )}
                </>
              )}

              {status === "ROUTED" && (
                <>
                  {(pendingRouting ?? acceptedRouting) && pendingRouting && (isAssignedToCurrentUser ? (
                    <>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                        disabled={isPending || !pendingRouting.routingCode || showDeclineForm}
                        onClick={() => pendingRouting.routingCode && handleAcceptRouting(pendingRouting.routingCode)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept Assignment
                      </Button>
                      {!showDeclineForm && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          disabled={isPending || !pendingRouting.routingCode}
                          onClick={() => {
                            setDecliningRoutingCode(pendingRouting.routingCode ?? null);
                            setShowDeclineForm(true);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                          Decline Assignment
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Only the assigned provider can accept or decline this assignment.
                    </p>
                  ))}
                  {canCompleteRouted && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                      disabled={isPending}
                      onClick={handleComplete}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark Complete
                    </Button>
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
                    variant="outline"
                    className="gap-1.5 border-amber-400/40 text-amber-600 hover:bg-amber-600 hover:text-white"
                    disabled={isPending}
                    onClick={() => onOpenSubPanel("reschedule")}
                  >
                    <CalendarClock className="h-4 w-4" />
                    Reschedule
                  </Button>
                </>
              )}

              {/* ACCEPTED: Complete + Tag */}
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
                    className="gap-1.5 border-blue-400/40 text-blue-600 hover:bg-blue-600 hover:text-white"
                    disabled={isPending}
                    onClick={() => onOpenSubPanel("tag")}
                  >
                    <Tags className="h-4 w-4" />
                    Tag Providers
                  </Button>
                </>
              )}

              {/* COMPLETED: Tag Providers (read-only management) */}
              {status === "COMPLETED" && (
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
              )}
            </div>

            {/* Inline reject/cancel form */}
            {showRejectForm && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-destructive uppercase tracking-wide">
                  {status === "PENDING" ? "Reject Appointment" : "Cancel Appointment"}
                </h4>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={
                      status === "PENDING"
                        ? "Please provide a reason for rejection..."
                        : "Please provide a reason for cancelling this appointment..."
                    }
                    rows={3}
                    className="resize-none text-sm"
                    disabled={isPending}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 gap-1.5"
                    disabled={isPending || !rejectReason.trim()}
                    onClick={handleRejectSubmit}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {isPending
                      ? (status === "PENDING" ? "Rejecting..." : "Cancelling...")
                      : (status === "PENDING" ? "Confirm Reject" : "Confirm Cancel")
                    }
                  </Button>
                </div>
              </div>
            )}

            {/* Inline decline assignment form */}
            {showDeclineForm && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-destructive uppercase tracking-wide">
                  Decline Assignment
                </h4>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Please provide a reason for declining..."
                    rows={3}
                    className="resize-none text-sm"
                    disabled={isPending}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => { setShowDeclineForm(false); setDeclineReason(""); setDecliningRoutingCode(null); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 gap-1.5"
                    disabled={isPending || !declineReason.trim()}
                    onClick={handleDeclineSubmit}
                  >
                    <XCircle className="h-4 w-4" />
                    {isPending ? "Declining..." : "Confirm Decline"}
                  </Button>
                </div>
              </div>
            )}

            {/* Inline return-to-queue form */}
            {showReturnForm && (
              <div className="rounded-xl border border-orange-400/30 bg-orange-50/50 dark:bg-orange-950/20 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                  Return Appointment to Queue
                </h4>
                <p className="text-xs text-muted-foreground">
                  This will reset the appointment to PENDING so another clinic member can receive it.
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Please provide a reason for returning this appointment..."
                    rows={3}
                    className="resize-none text-sm"
                    disabled={isPending}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => { setShowReturnForm(false); setReturnReason(""); }}
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={isPending || !returnReason.trim()}
                    onClick={handleReturnSubmit}
                  >
                    <Undo2 className="h-4 w-4" />
                    {isPending ? "Returning..." : "Confirm Return"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
