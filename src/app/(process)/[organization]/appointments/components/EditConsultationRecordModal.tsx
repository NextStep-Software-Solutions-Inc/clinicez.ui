"use client";

import { updateConsultationRecordAction } from "@actions/consultation/consultation-ticket.action";
import ActionButton from "@components/ActionButton"
import CustomModalContent from "@components/CustomModalContent";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@components/ui/dialog"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { DialogProps } from "@radix-ui/react-dialog";
import React, { useRef } from "react"
import { toast } from "sonner";

interface EditConsultationRecordModalProps extends DialogProps {
  record: {
    id: number,
    subject: string,
  }
  children: React.ReactNode
}

const EditConsultationRecordModal = React.forwardRef<any, EditConsultationRecordModalProps>((props, ref) => {
  const { record, children, ...res } = props
  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    const subject = formData.get("subject") as string
    toast.promise(updateConsultationRecordAction({
      consultationId: record.id,
      subject
    }), {
      loading: "Updating consultation record...",
      success: (res) => {
        if (res.status) {
          closeBtnRef.current?.click()
        }
        return res.message
      },
      error: "Failed to update consultation record."
    }) 
  }

  return (
    <Dialog {...res}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Update Consultation Record" 
        description="Fill in the fields below to update the consultation record."
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
              name="subject"
              defaultValue={record.subject}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <input ref={closeBtnRef} type="hidden"  value="ok"/>
            </DialogClose>
            <ActionButton form="consultation-record-form" type="submit">
            Save Changes
            </ActionButton>
          </DialogFooter>
        </form>
      </CustomModalContent>
    </Dialog>
  )
})
EditConsultationRecordModal.displayName = "EditConsultationRecordModal"
export default EditConsultationRecordModal