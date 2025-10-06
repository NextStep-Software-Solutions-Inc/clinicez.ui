"use client";

import { useRef, useState } from "react";

import { promiseWrapper } from "@/lib/with-error-handling";
import { completeAppointmentAction } from "@actions/appointments/appointment-attribute.action";
import ActionButton from "@components/ActionButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface CompleteAppointmentProps {
  disabled?: boolean;
  appointmentId: number;
  onCompleted?: () => void;
}
export default function CompleteAppointment({ disabled = false, appointmentId, onCompleted }: CompleteAppointmentProps) {

  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const action = async (formData: FormData) => {
    formData.append("appointmentId", appointmentId.toString());
    toast.promise(promiseWrapper(completeAppointmentAction)(formData), {
      loading: "Processing...",
      success: (res) => {
        onCompleted?.();
        return res.message;
      },
      error: error => error,
    });
  };
  return (
    <>
      <form ref={formRef} action={action}>
        <Tooltip>
          <TooltipTrigger asChild>
            <ActionButton
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => setOpen(true)}
            >
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="sr-only">Set Complete</span>
            </ActionButton>
          </TooltipTrigger>
          <TooltipContent>Set Complete</TooltipContent>
        </Tooltip>
      </form>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this appointment as complete?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!disabled) {
                  setOpen(false);
                  formRef.current?.requestSubmit();
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}