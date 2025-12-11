"use client";

import { promiseWrapper } from "@/lib/with-error-handling";
import { returnAppointmentAssignmentAction } from "@actions/appointments/appointment-routing.action";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { Undo2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ReturnAppointmentAssignmentProps {
  disabled?: boolean
  appointmentRoutingId: number
  onReturned?: () => void
}

export default function ReturnAppointmentAssignment({disabled = false, appointmentRoutingId, onReturned}: ReturnAppointmentAssignmentProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const action = async (formData: FormData) => {
    formData.append("appointmentRoutingId", appointmentRoutingId.toString());
    toast.promise(promiseWrapper(returnAppointmentAssignmentAction)(formData), {
      loading: "Returning appointment assignment...",
      success: (res) => {
        onReturned?.();
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
            <Button variant="ghost" className="text-orange-500" size="icon" disabled={disabled}>
              <Undo2 className="h-4 w-4" />
              <span className="sr-only">Return Assignment</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Return Assignment</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-96">
        <p>
            Are you sure you want to return this accepted appointment assignment? The appointment will be returned for reassignment.
        </p>
        <form 
          action={action}
          id="return-appointment-form"
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-baseline gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason<span className="text-destructive">*</span>
            </Label>
            <Input
              id="reason"
              name="reason"
              placeholder="Enter reason here"
              className="col-span-3"
              required
            />
          </div>
          <ActionButton form="return-appointment-form" type="submit" variant="default">
            Return Assignment
          </ActionButton>
        </form>
      </PopoverContent>
    </Popover>
  );
}
