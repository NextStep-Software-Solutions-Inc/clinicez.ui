"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"

import { Button } from "@components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"

import React from "react"
import { useDropdownMenu } from "@components/DropdownMenuProvider"
import { toast } from "sonner"
import { UserOrganizationStatus } from "@prisma/common/client"
import Each from "@components/utils/Each"
import { GetUserOrganizations, setMembershipRequestStatusAction } from "@actions/users/user-organization.action"
import { revalidatePath } from "@actions/cache.action"
import ConfirmDeleteMembership from "./ConfirmDeleteMembership"
import { mutate } from "swr"
import RequestAdditionalInfo from "./RequestAdditionalInfo"
interface MembershipTableRowActionsProps<TData> {
  applicationRequest: GetUserOrganizations["data"][number]
}

export default function MembershipTableRowActions<TData>({
  applicationRequest,
}: MembershipTableRowActionsProps<TData>) {
  const { dropdownOpen, setDropdownOpen, hasOpenDialog, dropdownTriggerRef } = useDropdownMenu()!;

  const revalidateMembershipTable = async () => {
    revalidatePath(`/[organization]/membership`, "page")
    mutate((key) =>  typeof key === 'string' && key.startsWith(`/api/user-organizations`), undefined, {
      revalidate:true
    })
  }

  const setStatus = async (status: UserOrganizationStatus) => {
    toast.promise(setMembershipRequestStatusAction(applicationRequest.id, status), {
      loading: "Updating status...",
      success: (res) => {
        if(res.status) {
          revalidateMembershipTable()
        }
        return res.message
      },
      error: "Failed to update status",
      position: "top-center",
    })
    
  }
  let currentStatus = applicationRequest.status;
  const statusOptions = [
    { status: "ACTIVE", label: "Activate" },
    { status: "INACTIVE", label: "Deactivate" },
    { status: "PENDING", label: "Set Pending" },
    { status: "SUSPENDED", label: "Suspend" },
  ];
  const onConfirmDelete = () =>{
    setDropdownOpen(false)
    revalidateMembershipTable()
  }
  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild ref={dropdownTriggerRef}>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent  align="end" className="w-full" hidden={hasOpenDialog}>
        <Each
          of={statusOptions}
          render={(option, index) => (
            currentStatus !== option.status && (
              <React.Fragment key={option.status}>
                <DropdownMenuItem onClick={() => setStatus(option.status as UserOrganizationStatus)}>
                  {option.label}
                </DropdownMenuItem>
              </React.Fragment>
            )
          )}
        />
        <DropdownMenuItem asChild>
          <RequestAdditionalInfo onSend={() => setDropdownOpen(false)} userOrganizationId={applicationRequest.id}/>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <ConfirmDeleteMembership onConfirmDelete={onConfirmDelete} userOrganizationId={applicationRequest.id}/>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
