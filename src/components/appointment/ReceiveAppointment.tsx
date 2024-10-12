"use client";

import { receiveAppointmentAction } from "@actions/appointments/appointment-attribute.action";
import ActionButton from "@components/ActionButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { userDefaultOrganizationRoleAtom } from "@state/user-role";
import { useAtomValue } from "jotai";
import { MailPlus } from "lucide-react";
import { toast } from "sonner";

interface ReceiveAppointmentProps {
  disabled?: boolean;
  appointmentId: number;
  orgUId: string;
  onReceived?: () => void;
}
export default function ReceiveAppointment({disabled = false, appointmentId, onReceived, orgUId}: ReceiveAppointmentProps) {
  
  const userDefaultOrganizationRole = useAtomValue(userDefaultOrganizationRoleAtom);
  const action = async (formData: FormData) => {
    const role = userDefaultOrganizationRole[orgUId].roleName;
    formData.append("status", "RECEIVED");
    formData.append("appointmentId", appointmentId.toString());
    if(role) formData.append("role", role);

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
