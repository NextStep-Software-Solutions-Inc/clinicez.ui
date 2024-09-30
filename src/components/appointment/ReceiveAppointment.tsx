"use client";

import { receiveAppointmentAction } from "@actions/appointments/appointment-attribute.action";
import ActionButton from "@components/ActionButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { MailPlus } from "lucide-react";
import { toast } from "sonner";

interface ReceiveAppointmentProps {
  disabled?: boolean;
  appointmentId: number;
  onReceived?: () => void;
}
export default function ReceiveAppointment({disabled = false, appointmentId, onReceived}: ReceiveAppointmentProps) {
  
  const action = async (formData: FormData) => {
    formData.append("status", "RECEIVED");
    formData.append("appointmentId", appointmentId.toString());

    toast.promise(receiveAppointmentAction(formData), {
      loading: "Receiving appointment...",
      success: (res) => {
        if (res) {
          onReceived?.();
          return "Appointment received.";
        }
        return "Something went wrong.";
      },
      error: "Failed to receive appointment.",
    });
  }; 

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <form action={action}>
          <ActionButton variant="ghost" size="icon" disabled={disabled}>
            <MailPlus className="h-4 w-4" />
            <span className="sr-only">Receive Appointment</span>
          </ActionButton>
        </form>
      </TooltipTrigger>
      <TooltipContent>Receive Appointment</TooltipContent>
    </Tooltip>
  );
}
