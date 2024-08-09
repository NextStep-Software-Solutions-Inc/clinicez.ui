"use client";

import { acceptAppointmentAction } from "@actions/appointments/appointments.action";
import ActionButton from "@components/ActionButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { MailCheck } from "lucide-react";
import { useFormState } from "react-dom";
import { toast } from "sonner";


const actionWrapper = async (prev: any, formData: FormData) => {
  const res = await acceptAppointmentAction(formData);
  if (res) {
    toast.success("Appointment assigned accepted successfully.");
  }
  return res;
};

export default function AcceptAppointmentAssignment({disabled = false}: {disabled?: boolean}) {
  const [state, action] = useFormState(actionWrapper, false)

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
