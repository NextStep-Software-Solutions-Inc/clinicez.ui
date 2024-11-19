"use client";

import { promiseWrapper } from "@/lib/with-error-handling";
import { insertToCalendar } from "@actions/google/auth.action";
import ActionButton from "@components/ActionButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { CalendarCheck } from "lucide-react";
import { toast } from "sonner";

interface ConfirmBookingProps {
  disabled?: boolean;
  appointmentId: number;
  onAccepted?: () => void;
}

export default function ConfirmBooking({disabled = false, appointmentId, onAccepted}: ConfirmBookingProps) {
  
  const action = async () => {
    toast.promise(promiseWrapper(insertToCalendar)(appointmentId), {
      loading: "Confirming booking...",
      success: (res) => {
        onAccepted?.();
        return res.message;
      },
      error: error => error,
    })
  };
  return (
    <Tooltip >
      <TooltipTrigger asChild>
        <form action={action}>
          <ActionButton variant="ghost" size="icon" disabled={disabled}>
            <CalendarCheck className="h-4 w-4" />
            <span className="sr-only">Confirm Booking</span>
          </ActionButton>
        </form>
      </TooltipTrigger>
      <TooltipContent>Confirm Booking</TooltipContent>
    </Tooltip>
  );
}
