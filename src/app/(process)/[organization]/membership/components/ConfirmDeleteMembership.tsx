"use client";

import { deleteMembershipAction } from "@actions/user-organization.action";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import { PopoverClose } from "@radix-ui/react-popover";
import { Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ConfirmDeleteMembershipProps {
  disabled?: boolean
  userOrganizationId: number
}

export default function ConfirmDeleteMembership({disabled = false, userOrganizationId}: ConfirmDeleteMembershipProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const action = async () => {
    toast.promise(deleteMembershipAction(userOrganizationId), {
    })
  }

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild ref={triggerRef}>
              <Button className="group/delete invisible group-hover/item:visible" variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-destructive group-hover/delete:scale-125 transition-all" />
                <span className="sr-only">Delete Membership</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Delete Membership</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-96">
        <p>
            Are you sure you want to delete this membership?
        </p>
        <form 
          action={action}
          id="delete-membership-form"
          className="flex gap-4 py-4"
        >
          <PopoverClose asChild >
            <Button variant="ghost" type="button">Cancel</Button>
          </PopoverClose>
          <ActionButton 
            form="delete-membership-form"
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
