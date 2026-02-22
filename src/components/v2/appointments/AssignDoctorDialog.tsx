"use client";

import { useState } from "react";
import { Stethoscope, User, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  assignAppointmentAction,
  cancelAppointmentRoutingAction,
} from "@/actions/appointments/appointment-routing.action";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import type { GetHPsType } from "@/actions/hp.actions";

type Appointment = NonNullable<GetAppointments["data"]>[number];

interface AssignDoctorDialogProps {
  open: boolean;
  appointment: Appointment;
  hps: GetHPsType;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignDoctorDialog({
  open,
  appointment,
  hps,
  onClose,
  onSuccess,
}: AssignDoctorDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [selectedHpId, setSelectedHpId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Active (PENDING or ACCEPTED) routing that would need to be cancelled before reassigning
  const activeRouting = appointment.AppointmentRouting?.find(
    (r) => r.status === "PENDING" || r.status === "ACCEPTED"
  );
  const isReassigning = !!activeRouting;
  const activeRoutingDoctorName =
    activeRouting?.RoutedTo?.HPProfile?.name ??
    `${activeRouting?.RoutedTo?.User?.firstName ?? ""} ${activeRouting?.RoutedTo?.User?.lastName ?? ""}`.trim();

  const handleAssign = async () => {
    if (!selectedHpId) {
      toast.error("Please select a doctor to assign.");
      return;
    }
    if (isReassigning && !cancelReason.trim()) {
      toast.error("A reason is required when changing the assigned doctor.");
      return;
    }

    setIsPending(true);

    // If reassigning: cancel the existing routing first
    if (isReassigning && activeRouting) {
      const cancelResult = await cancelAppointmentRoutingAction({
        appointmentRoutingId: activeRouting.id,
        reason: cancelReason.trim(),
      });
      if (!cancelResult.status) {
        toast.error(cancelResult.message);
        setIsPending(false);
        return;
      }
    }

    const result = await assignAppointmentAction({
      routedTo: selectedHpId,
      appointmentId: appointment.id,
    });
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      setCancelReason("");
      setSelectedHpId(null);
      onSuccess();
    } else {
      toast.error(result.message);
    }
  };

  const handleClose = () => {
    setCancelReason("");
    setSelectedHpId(null);
    onClose();
  };

  const requester = appointment.Requesters?.[0]?.User;
  const patientName = requester
    ? `${requester.firstName ?? ""} ${requester.lastName ?? ""}`.trim()
    : "Unknown Patient";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            {isReassigning ? "Reassign Doctor" : "Assign Doctor"}
          </DialogTitle>
          <DialogDescription>
            {isReassigning
              ? `Currently assigned to ${activeRoutingDoctorName}. Select a new doctor to reassign for ${patientName}.`
              : `Select a doctor to assign this appointment for ${patientName}.`}
          </DialogDescription>
        </DialogHeader>

        {/* Reassignment reason (required when active routing exists) */}
        {isReassigning && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-900/10 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Reason for reassignment required
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-amber-700">
                Cancel reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why is the current assignment being cancelled?"
                rows={2}
                className="resize-none text-sm"
                disabled={isPending}
              />
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {hps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No healthcare providers available.
            </p>
          ) : (
            hps.map((hp) => {
              const name =
                hp.HPProfile?.name ??
                `${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim();
              const initials = `${hp.User.firstName?.charAt(0) ?? ""}${hp.User.lastName?.charAt(0) ?? ""}`;
              const isSelected = selectedHpId === hp.id;
              // Disable selecting the currently active assignee
              const isCurrent = activeRouting?.RoutedTo?.id === hp.id;

              return (
                <button
                  key={hp.id}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setSelectedHpId(hp.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                    isCurrent
                      ? "border-border/30 bg-muted/40 opacity-50 cursor-not-allowed"
                      : isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-background/50 hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <Avatar className="h-9 w-9 rounded-full flex-shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {initials || <User className="h-3.5 w-3.5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">
                      {hp.HPProfile?.title ? `${hp.HPProfile.title} ` : ""}
                      {name}
                    </p>
                    {hp.HPType?.name && (
                      <p className="text-xs text-muted-foreground">{hp.HPType.name}</p>
                    )}
                    {hp.HPProfile?.specialties && hp.HPProfile.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {hp.HPProfile.specialties.slice(0, 2).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs px-1.5 py-0">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {isCurrent && (
                      <p className="text-xs text-amber-600 mt-0.5">Currently assigned</p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-primary/90 hover:bg-primary"
            disabled={isPending || !selectedHpId || (isReassigning && !cancelReason.trim())}
            onClick={handleAssign}
          >
            {isPending ? "Assigning..." : isReassigning ? "Reassign Doctor" : "Assign Doctor"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
