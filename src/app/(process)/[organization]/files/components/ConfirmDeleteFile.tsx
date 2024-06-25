"use client";

import { deleteFileAction } from "@actions/file.actions";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import { PopoverClose } from "@radix-ui/react-popover";
import { Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ConfirmDeleteFileProps {
  disabled?: boolean
  fileId: number
}

export default function ConfirmDeleteFile({disabled = false, fileId}: ConfirmDeleteFileProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const action = async () => {
    toast.promise(deleteFileAction(fileId), {
      loading: "Deleting file...",
      success: () => {
        return "File deleted successfully."
      },
      error: "Error deleting file."
    });
  }


  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild ref={triggerRef}>
              <Button className="group/delete invisible group-hover/item:visible" variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-destructive group-hover/delete:scale-125 transition-all" />
                <span className="sr-only">Delete</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-96">
        <p>
            Are you sure you want to delete this file?
        </p>
        <form 
          action={action}
          id="delete-file-form"
          className="flex gap-4 py-4"
        >
          <PopoverClose asChild >
            <Button variant="ghost" type="button">Cancel</Button>
          </PopoverClose>
          <ActionButton 
            form="delete-file-form"
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
