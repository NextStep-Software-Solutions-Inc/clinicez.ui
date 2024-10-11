"use client";

import { deleteMembershipAction } from "@actions/users/user-organization.action";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import { PopoverClose } from "@radix-ui/react-popover";
import { Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { revalidate } from "../../app/(process)/[organization]/membership/page";
import { revalidatePath } from "@actions/cache.action";

interface ConfirmDeleteMembershipProps {
  disabled?: boolean
  userOrganizationId: number
  onConfirmDelete?: () => void
}

export default function ConfirmDeleteMembership({disabled = false, userOrganizationId, onConfirmDelete}: ConfirmDeleteMembershipProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  const action = async () => {
    toast.promise(deleteMembershipAction(userOrganizationId), {
      loading: "Deleting membership...",
      success: (res) => {
        if(res.status) {
          onConfirmDelete?.()
        }
        return res.message
      },
      error: "Failed to delete membership",
    })
  }

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild ref={triggerRef}>
              <Button variant="ghost" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2 " />
                Delete Membership
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
            <Button ref={closeBtnRef} variant="ghost" type="button">Cancel</Button>
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
