"use client"

import { DotsHorizontalIcon, GearIcon } from "@radix-ui/react-icons"

import { Button } from "@components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"

import ConsultationTicketSettingSheet from "../appointment/ConsultationTicketSettingSheet"
import EditConsultationTicketModal from "../appointment/EditConsultationTicketModal"
import React from "react"
import { useDropdownMenu } from "@components/DropdownMenuProvider"
import { toast } from "sonner"
import { toggleArchiveConsultationTicketAction, GetConsultationTickets, GetConsultationTicket } from "@actions/consultation/consultation-ticket.action"
import { Archive, Pencil, Pill } from "lucide-react"
interface ConsultationTicketTableRowActionsProps<TData> {
  consultation: NonNullable<GetConsultationTicket["data"]> | NonNullable<GetConsultationTickets["data"]>[number]
}

export default function ConsultationTicketTableRowActions<TData>({consultation}: ConsultationTicketTableRowActionsProps<TData>) {
  const { dropdownOpen, setDropdownOpen, hasOpenDialog, dropdownTriggerRef, handleDialogItemSelect, handleDialogItemOpenChange } = useDropdownMenu()!;

  const handleArchive = () => {
    toast.promise(toggleArchiveConsultationTicketAction(consultation.id, !consultation.isArchived), {
      position: "top-center",
      loading: "Toggling archive status...",
      success: (res) => {
        return res.message
      },
      error: "Failed to toggle archive status",
    })
  }
  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild ref={dropdownTriggerRef}>
        <Button
          variant="outline"
          size="icon"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent  align="end" className="w-[160px]" hidden={hasOpenDialog}>
        <EditConsultationTicketModal onOpenChange={handleDialogItemOpenChange} 
          record={{
            id: consultation.id,
            subject: consultation.subject ?? "",
            clinicUid: consultation.Clinic.clinicUid
          }}>
          <DropdownMenuItem onSelect={handleDialogItemSelect}>
            <Pencil className="w-4 h-4 mr-2"/>
            Edit</DropdownMenuItem>
        </EditConsultationTicketModal>
        <ConsultationTicketSettingSheet 
          consultationId={consultation.id}
          clinicUid={consultation.Clinic.clinicUid}
          onOpenChange={handleDialogItemOpenChange}
        >
          <DropdownMenuItem onSelect={handleDialogItemSelect}>
            <GearIcon className="w-4 h-4 mr-2"/>
            Settings
          </DropdownMenuItem>
        </ConsultationTicketSettingSheet>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleArchive} className="text-destructive">
          <Archive className="w-4 h-4 mr-2"/>
          {consultation.isArchived ? "Unarchive" : "Archive"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
