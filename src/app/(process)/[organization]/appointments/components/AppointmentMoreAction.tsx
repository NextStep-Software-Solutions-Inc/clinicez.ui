"use client";

import { DropdownMenu as DropdownMenuShad, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../../components/ui/dropdown-menu";
import {  useDropdownMenu } from "../../../../../components/DropdownMenuProvider";
import ConsultationRecordSheet from "./ConsultationRecordSheet";

interface DropdownMenuProps {
    children: React.ReactNode;
}

export default function AppointmentMoreAction({children}: DropdownMenuProps) {
  const {dropdownOpen, dropdownTriggerRef,handleDialogItemOpenChange, handleDialogItemSelect,hasOpenDialog, setDropdownOpen} = useDropdownMenu()!;
  return (
    <DropdownMenuShad open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild ref={dropdownTriggerRef}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" hidden={hasOpenDialog}>
        <ConsultationRecordSheet onOpenChange={handleDialogItemOpenChange}>
          <DropdownMenuItem onSelect={handleDialogItemSelect}>
            View Consultation Records
          </DropdownMenuItem>
        </ConsultationRecordSheet>
      </DropdownMenuContent>
    </DropdownMenuShad>
  )
}
