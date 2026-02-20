"use client";

import { useState } from "react";
import { Stethoscope, User } from "lucide-react";
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
import { toast } from "sonner";
import { assignAppointmentAction } from "@/actions/appointments/appointment-routing.action";
import type { GetAppointments } from "@/actions/appointments/appointments.action";
import type { GetHPsType } from "@/actions/hp.actions";

type Appointment = GetAppointments["data"][number];

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

  const handleAssign = async () => {
    if (!selectedHpId) {
      toast.error("Please select a doctor to assign.");
      return;
    }
    setIsPending(true);
    const result = await assignAppointmentAction({
      routedTo: selectedHpId,
      appointmentId: appointment.id,
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Assign Doctor
          </DialogTitle>
          <DialogDescription>
            Select a doctor to assign this appointment for {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-80 overflow-y-auto">
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

              return (
                <button
                  key={hp.id}
                  type="button"
                  onClick={() => setSelectedHpId(hp.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                    isSelected
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
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-primary/90 hover:bg-primary"
            disabled={isPending || !selectedHpId}
            onClick={handleAssign}
          >
            {isPending ? "Assigning..." : "Assign Doctor"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
