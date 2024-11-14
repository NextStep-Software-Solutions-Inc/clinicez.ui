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
import Each from "@components/utils/Each"
import { GetUserOrganizations, setMembershipRequestStatusAction } from "@actions/users/user-organization.action"
import { revalidatePath } from "@actions/cache.action"
import ConfirmDeleteMembership from "./ConfirmDeleteMembership"
import { mutate } from "swr"
import RequestAdditionalInfo from "./RequestAdditionalInfo"
import Link from "next/link"
import { User } from "lucide-react"
import { OrganizationMemberStatus } from "@/types"
import { promiseWrapper } from "@/lib/with-error-handling"
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

  const setStatus = async (status: OrganizationMemberStatus) => {
    toast.promise(promiseWrapper(setMembershipRequestStatusAction)(applicationRequest.id, status), {
      loading: "Updating status...",
      success: (res) => {
        revalidateMembershipTable()
        return res.message
      },
      error: (error) => error,
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
                <DropdownMenuItem onClick={() => setStatus(option.status as OrganizationMemberStatus)}>
                  <>{option.label}</>
                </DropdownMenuItem>
              </React.Fragment>
            )
          )}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/organizations/${applicationRequest.Organization.orgUid}/membership/${applicationRequest.User.userId}`}>
            <User className="mr-1 w-4 h-4"/>
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
