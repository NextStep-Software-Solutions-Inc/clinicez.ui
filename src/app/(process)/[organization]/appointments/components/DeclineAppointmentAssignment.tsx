"use client";

import { rejectAppointmentAction } from "@actions/appointments/appointment-attribute.action";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { MailX } from "lucide-react";
import React from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";

export default function DeclineAppointmentAssignment({disabled = false}: {disabled?: boolean}) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const action= async (formData: FormData) => {
    const res = await rejectAppointmentAction(formData);
    if(res) toast.success("Appointment assigned declined successfully.");
    triggerRef.current?.click();
    return res;
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild ref={triggerRef}>
            <Button variant="destructive" size="icon" disabled={disabled}>
              <MailX className="h-4 w-4" />
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
