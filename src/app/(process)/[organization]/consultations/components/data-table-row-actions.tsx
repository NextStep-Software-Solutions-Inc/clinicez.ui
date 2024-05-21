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

import { labels } from "../data/data"
import ConsultationRecordSettingSheet from "../../appointments/components/ConsultationRecordSettingSheet"
import EditConsultationRecordModal from "../../appointments/components/EditConsultationRecordModal"
import React from "react"
import { useDropdownMenu } from "@components/DropdownMenuProvider"
interface DataTableRowActionsProps<TData> {
  consultation: Consultation
}

export function DataTableRowActions<TData>({
  consultation,
}: DataTableRowActionsProps<TData>) {
  const { dropdownOpen, setDropdownOpen, hasOpenDialog, dropdownTriggerRef, handleDialogItemSelect, handleDialogItemOpenChange } = useDropdownMenu()!;

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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={consultation.label}>
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
