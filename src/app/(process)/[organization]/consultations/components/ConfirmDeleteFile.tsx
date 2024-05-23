"use client";

import { deleteConsultationFileAction } from "@actions/consultations.action";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { PopoverClose } from "@radix-ui/react-popover";
import { MailX, Trash2 } from "lucide-react";
import React from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";

interface ConfirmDeleteFileProps {
  disabled?: boolean
  fileId: string
}

export default function ConfirmDeleteFile({disabled = false, fileId}: ConfirmDeleteFileProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const actionWrapper = async (prev: any, formData: FormData) => {
    const res = await deleteConsultationFileAction(fileId);
    if(res) toast.success("Consultation file deleted successfully.");
    triggerRef.current?.click();
    return res;
  }
  const [state, action] = useFormState(actionWrapper, false);


  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild ref={triggerRef}>
            <Button className="ml-auto" variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="sr-only">Delete</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-96">
        <p>
            Are you sure you want to delete this file?
        </p>
        <form 
          action={action}
          id="delete-consultation-file-form"
          className="flex gap-4 py-4"
        >
          <PopoverClose asChild >
            <Button variant="ghost" type="button">Cancel</Button>
          </PopoverClose>
          <ActionButton 
            form="delete-consultation-file-form"
            type="submit" 
            variant="destructive"
            className="grow"
          >
            Delete
          </ActionButton>
        </form>
      </PopoverContent>
    </Popover>
  );
}
