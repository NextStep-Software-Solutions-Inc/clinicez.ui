"use client";

// import { revalidatePath } from "@actions/cache.action";
import { updateConsultationTicketAction } from "@actions/consultation/consultation-ticket.action";
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
import { mutate } from "swr";

interface EditConsultationTicketModalProps extends DialogProps {
  record: {
    id: number,
    subject: string,
    orgUid: string
  }
  children: React.ReactNode
}

const EditConsultationTicketModal = React.forwardRef<any, EditConsultationTicketModalProps>((props, ref) => {
  const { record, children, ...res } = props
  const closeBtnRef = useRef<HTMLInputElement>(null)

  const revalidate = async () => {
    // revalidatePath(`${record.orgUid}/consultations`,  "page")
    mutate((key) =>  typeof key === 'string' && key.startsWith(`/api/organizations/${record.orgUid}/consultations`), undefined, {
      revalidate: true
    })
  }
  const action = async (formData: FormData) => {
    const subject = formData.get("subject") as string
    toast.promise(updateConsultationTicketAction({
      consultationId: record.id,
      subject
    }), {
      loading: "Updating consultation ticket...",
      success: (res) => {
        if (res.status) {
          closeBtnRef.current?.click()
          revalidate()
        }
        return res.message
      },
      error: "Failed to update consultation ticket."
    }) 
  }

  return (
    <Dialog {...res}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Update Consultation Ticket" 
        description="Fill in the fields below to update the consultation ticket."
      >
        <form 
          action={action}
          id="consultation-ticket-form"
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
            <ActionButton form="consultation-ticket-form" type="submit">
            Save Changes
            </ActionButton>
          </DialogFooter>
        </form>
      </CustomModalContent>
    </Dialog>
  )
})
EditConsultationTicketModal.displayName = "EditConsultationTicketModal"
export default EditConsultationTicketModal