"use client";

import { receiveAppointmentAction } from "@actions/appointments/appointments.action";
import ActionButton from "@components/ActionButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { MailPlus } from "lucide-react";
import { useFormState } from "react-dom";
import { toast } from "sonner";


const actionWrapper = async (prev: any, formData: FormData) => {
  const res = await receiveAppointmentAction(formData);
  if (res) {
    toast.success("Appointment received successfully.");
  }
  return res;
};

export default function ReceiveAppointment({disabled = false}: {disabled?: boolean}) {
  const [state, action] = useFormState(actionWrapper, false)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <form action={action}>
          <ActionButton variant="ghost" size="icon" disabled={disabled}>
            <MailPlus className="h-4 w-4" />
            <span className="sr-only">Receive</span>
          </ActionButton>
        </form>
      </TooltipTrigger>
      <TooltipContent>Receive</TooltipContent>
    </Tooltip>
  );
}
