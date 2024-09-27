"use client";

import { acceptAppointmentAction } from "@actions/appointments/appointment-routing.action";
import ActionButton from "@components/ActionButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

interface AcceptAppointmentAssignmentProps {
  disabled?: boolean;
  appointmentId: number;
  onAccepted?: () => void;
}

export default function AcceptAppointmentAssignment({disabled = false, appointmentId, onAccepted}: AcceptAppointmentAssignmentProps) {
  const action = async (formData: FormData) => {

    formData.append("appointmentId", appointmentId.toString());

    toast.promise(acceptAppointmentAction(formData), {
      loading: "Accepting appointment assignment...",
      success: (res) => {
        if(!res.status) return `Something went wrong: ${res.message}`;
        onAccepted?.();
        return "Appointment assignment accepted successfully."
      },
      error: "Failed to accept appointment assignment.",
    })
  };
  return (
    <Tooltip >
      <TooltipTrigger asChild>
        <form action={action}>
          <ActionButton variant="ghost" size="icon" disabled={disabled}>
            <MailCheck className="h-4 w-4" />
            <span className="sr-only">Accept Assignment</span>
          </ActionButton>
        </form>
      </TooltipTrigger>
      <TooltipContent>Accept Assignment</TooltipContent>
    </Tooltip>
  );
}
