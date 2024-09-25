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

import ConsultationRecordSettingSheet from "../../appointments/components/ConsultationRecordSettingSheet"
import EditConsultationRecordModal from "../../appointments/components/EditConsultationRecordModal"
import React from "react"
import { useDropdownMenu } from "@components/DropdownMenuProvider"
import { toast } from "sonner"
import { archiveConsultationRecordAction, GetConsultationRecords } from "@actions/consultation/consultation-ticket.action"
import { Archive, Pencil } from "lucide-react"
interface DataTableRowActionsProps<TData> {
  consultation: GetConsultationRecords["data"][number]
}

export function DataTableRowActions<TData>({
  consultation,
}: DataTableRowActionsProps<TData>) {
  const { dropdownOpen, setDropdownOpen, hasOpenDialog, dropdownTriggerRef, handleDialogItemSelect, handleDialogItemOpenChange } = useDropdownMenu()!;

  const handleArchive = () => {
    toast.promise(archiveConsultationRecordAction(consultation.id), {
      position: "top-center",
      loading: "Archiving...",
      success: (res) => {
        return res.message
      },
      error: "Failed to archive",
    })
  }
  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild ref={dropdownTriggerRef}>
        <Button
          variant="ghost"
          size="lg"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent  align="end" className="w-[160px]" hidden={hasOpenDialog}>
        <EditConsultationRecordModal onOpenChange={handleDialogItemOpenChange} record={{
          id: consultation.id,
          subject: consultation.subject,
        }}>
          <DropdownMenuItem onSelect={handleDialogItemSelect}>
            <Pencil className="w-4 h-4 mr-2"/>
            Edit</DropdownMenuItem>
        </EditConsultationRecordModal>
        <ConsultationRecordSettingSheet onOpenChange={handleDialogItemOpenChange}>
          <DropdownMenuItem onSelect={handleDialogItemSelect}>
            <GearIcon className="w-4 h-4 mr-2"/>
            Settings
          </DropdownMenuItem>
        </ConsultationRecordSettingSheet>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleArchive}>
          <Archive className="w-4 h-4 mr-2"/>
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
