"use client";

import { completeAppointmentAction } from "@actions/appointments/appointment-attribute.action";
import ActionButton from "@components/ActionButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface CompleteAppointmentProps {
  disabled?: boolean;
  appointmentId: number;
  onCompleted?: () => void;
}
export default function CompleteAppointment({disabled = false, appointmentId, onCompleted}: CompleteAppointmentProps) {
  
  const action = async (formData: FormData) => {
    formData.append("status", "COMPLETED");
    formData.append("appointmentId", appointmentId.toString());

    toast.promise(completeAppointmentAction(formData), {
      loading: "Processing...",
      success: (res) => {
        if (res) {
          onCompleted?.();
          return "Appointment completed.";
        }
        return "Something went wrong.";
      },
      error: "Failed to process the appointment.",
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <form action={action}>
          <ActionButton variant="ghost" size="icon" disabled={disabled}>
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="sr-only">Set Complete</span>
          </ActionButton>
        </form>
      </TooltipTrigger>
      <TooltipContent>Set Complete</TooltipContent>
    </Tooltip>
  );
}
