"use client";

import { promiseWrapper } from "@/lib/with-error-handling";
import { acceptAppointmentAction } from "@actions/appointments/appointment-routing.action";
import ActionButton from "@components/ActionButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { MessageSquareMore } from "lucide-react";
import { toast } from "sonner";

interface AcceptAppointmentAssignmentProps {
  disabled?: boolean;
  routingCode: string;
  onAccepted?: () => void;
}

export default function AcceptAppointmentAssignment({disabled = false, routingCode, onAccepted}: AcceptAppointmentAssignmentProps) {
  const action = async (formData: FormData) => {

    formData.append("routingCode", routingCode);
    toast.promise(promiseWrapper(acceptAppointmentAction)(formData), {
      loading: "Accepting appointment assignment...",
      success: (res) => {
        onAccepted?.();
        return res.message
      },
      error: error => error
    })
  };
  return (
    <Tooltip >
      <TooltipTrigger asChild>
        <form action={action}>
          <ActionButton variant="ghost" size="icon" disabled={disabled}>
            <MessageSquareMore className="h-4 w-4" />
            <span className="sr-only">Accept Assignment</span>
          </ActionButton>
        </form>
      </TooltipTrigger>
      <TooltipContent>Accept Assignment</TooltipContent>
    </Tooltip>
  );
}
