"use client";

import { promiseWrapper } from "@/lib/with-error-handling";
import { declineAppointmentAction } from "@actions/appointments/appointment-routing.action";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { MessageSquareOff } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface DeclineAppointmentAssignmentProps {
  disabled?: boolean
  routingCode: string
  onDeclined?: () => void
}

export default function DeclineAppointmentAssignment({disabled = false, routingCode, onDeclined}: DeclineAppointmentAssignmentProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const action = async (formData: FormData) => {
    formData.append("routingCode", routingCode);
    toast.promise(promiseWrapper(declineAppointmentAction)(formData), {
      loading: "Declining appointment assignment...",
      success: (res) => {
        onDeclined?.();
        return res.message;
      },
      error: error => error
    })
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild ref={triggerRef}>
            <Button variant="ghost" className="text-destructive" size="icon" disabled={disabled}>
              <MessageSquareOff className="h-4 w-4" />
              <span className="sr-only">Decline Assignment</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Decline Assignment</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-96">
        <p>
            Are you sure you want to decline this appointment assigned to you?
        </p>
        <form 
          action={action}
          id="consultation-record-form"
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-baseline gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Input
              id="reason"
              name="reason"
              placeholder="Enter reason here"
              className="col-span-3"
            />
          </div>
          <ActionButton form="consultation-record-form" type="submit" variant="destructive">
            Decline
          </ActionButton>
        </form>
      </PopoverContent>
    </Popover>
  );
}
