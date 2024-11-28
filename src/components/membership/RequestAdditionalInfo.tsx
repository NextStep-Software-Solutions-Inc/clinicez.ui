"use client";

import { requestMembershipAdditionalInfo } from "@/actions/organizations/org-member.action";
import { promiseWrapper } from "@/lib/with-error-handling";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import { PopoverClose } from "@radix-ui/react-popover";
import { Send } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface RequestAdditionalInfoProps {
  disabled?: boolean
  userOrganizationId: number
  onSend?: () => void
}

export default function RequestAdditionalInfo({disabled = false, userOrganizationId, onSend}: RequestAdditionalInfoProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  const action = async () => {
    toast.promise(promiseWrapper(requestMembershipAdditionalInfo)(userOrganizationId), {
      loading: "Sending request...",
      success: (res) => {
        onSend?.()
        return res.message
      },
      error: error =>error,
    })
  }

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild ref={triggerRef}>
              <Button variant="ghost" className="text-primary">
                <Send className="h-4 w-4 mr-2 " />
                Request Additional Info
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Request Additional Info</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-96">
        <p>
          This will send a request to the user for additional information.
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
            variant="default"
            className="grow"
          >
            Send
          </ActionButton>
        </form>
      </PopoverContent>
    </Popover>
  );
}
