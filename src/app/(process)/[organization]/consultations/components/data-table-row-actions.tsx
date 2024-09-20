"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"

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
import { GetConsultationRecords } from "@actions/consultation/consultation-record.action"
interface DataTableRowActionsProps<TData> {
  consultation: GetConsultationRecords["data"][number]
}

export function DataTableRowActions<TData>({
  consultation,
}: DataTableRowActionsProps<TData>) {
  const { dropdownOpen, setDropdownOpen, hasOpenDialog, dropdownTriggerRef, handleDialogItemSelect, handleDialogItemOpenChange } = useDropdownMenu()!;

  const notImplemented = () => {
    toast.info("This feature is not implemented yet", {
      position: "top-center"
    })
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
      <DropdownMenuContent  align="end" className="w-[160px]" hidden={hasOpenDialog}>
        <EditConsultationRecordModal onOpenChange={handleDialogItemOpenChange} record={{
          id: consultation.id,
          subject: consultation.subject,
        }}>
          <DropdownMenuItem onSelect={handleDialogItemSelect}>Edit</DropdownMenuItem>
        </EditConsultationRecordModal>
            
        <ConsultationRecordSettingSheet onOpenChange={handleDialogItemOpenChange}>
          <DropdownMenuItem onSelect={handleDialogItemSelect}>Settings</DropdownMenuItem>
        </ConsultationRecordSettingSheet>
        <DropdownMenuSeparator />
        {/* <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={consultation.subject}>
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator /> */}
        <DropdownMenuItem onClick={notImplemented}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
