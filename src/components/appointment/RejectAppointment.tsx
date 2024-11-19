"use client";

import { promiseWrapper } from "@/lib/with-error-handling";
import { rejectAppointmentAction } from "@actions/appointments/appointment-attribute.action";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { MailX } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface RejectAppointmentProps {
  disabled?: boolean;
  appointmentId: number;
  onRejected?: () => void;
}

export default function RejectAppointment({disabled = false, appointmentId, onRejected}: RejectAppointmentProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const action = async (formData: FormData) => {
    const reason = formData.get("reason") as string;

    if(!reason.trim()) {
      toast.error("Please provide a reason for rejecting the appointment.");
      return;
    }

    formData.append("appointmentId", appointmentId.toString());
    toast.promise(promiseWrapper(rejectAppointmentAction)(formData), {
      loading: "Rejecting appointment...",
      success: (res) => {
        onRejected?.();
        return res.message;
      },
      error: error => error,
    });
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild ref={triggerRef}>
            <Button variant="outline" className="text-destructive" size="icon" disabled={disabled}>
              <MailX className="h-4 w-4" />
              <span className="sr-only">Reject Appointment</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Reject Appointment</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-96">
        <p>
            Are you sure you want to reject this appointment?
        </p>
        <form 
          action={action}
          id="reject-appointment-form"
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-baseline gap-4">
            <Label htmlFor="reason" className="text-right">
              Remarks
            </Label>
            <Input
              id="reason"
              name="reason"
              required
              placeholder="Enter reason here"
              className="col-span-3"
            />
          </div>
          <ActionButton form="reject-appointment-form" type="submit" variant="destructive">
            Reject
          </ActionButton>
        </form>
      </PopoverContent>
    </Popover>
  );
}
