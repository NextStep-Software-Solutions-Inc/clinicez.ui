"use client";

import { createConsultationAction } from "@actions/consultations.action"
import ActionButton from "@components/ActionButton"
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@components/ui/dialog"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip"
import { ClipboardPlus } from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner";


export default function CreateConsultationRecordModal({disabled = false, subject}: {disabled?: boolean, subject: string}) {

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    const res = await createConsultationAction(formData)
    if (res) {
      toast.success("Consultation record created successfully.")
      closeBtnRef.current?.click()
    }
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={disabled}>
              <ClipboardPlus className="h-4 w-4" />
              <span className="sr-only">Create Consultation Record</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Create Consultation Record</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Create Consultation Record" 
        description="Fill in the fields below to create a new consultation record."
      >
        <form 
          action={action}
          id="consultation-record-form"
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-baseline gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Input
              id="subject"
              defaultValue={subject}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <input ref={closeBtnRef} type="hidden"  value="ok"/>
            </DialogClose>
            <ActionButton form="consultation-record-form" type="submit">
            Create
            </ActionButton>
          </DialogFooter>
        </form>
      </CustomModalContent>
    </Dialog>
  )
}
