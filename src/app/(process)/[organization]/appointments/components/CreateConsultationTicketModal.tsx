"use client";

import { createConsultationTicketAction } from "@actions/consultation/consultation-ticket.action";
import ActionButton from "@components/ActionButton"
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button"
import { Checkbox } from "@components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@components/ui/dialog"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip"
import { useOrgAppointment } from "@hooks/useAppointment";
import { ClipboardPlus } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react"
import { toast } from "sonner";


export default function CreateConsultationTicketModal({disabled = false, subject}: {disabled?: boolean, subject: string}) {
  const [followConsultationTicket, setFollowConsultationTicket] = useState(false)
  const router = useRouter();
  const params = useParams<{organization: string}>();
  const searchParams = useSearchParams();
  const orgUid = params.organization

  const appointmentId = parseInt(searchParams.get("_appointment") as string)
  const {mutate} = useOrgAppointment({
    orgId: orgUid,
    appointmentId
  })

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    const subject = String(formData.get("subject"))
    const systemId = Number(formData.get("systemId"))
    toast.promise(createConsultationTicketAction({appointmentId, orgUid, subject, systemId}), {
      loading: "Creating consultation ticket...",
      success: (res) => {
        if(res.status) {
          closeBtnRef.current?.click()
          mutate()
          followConsultationTicket && router.push(`/${params.organization}/consultations/${res.data?.id}?${searchParams.toString()}`);
        }
        return res.message
      },
      error: "Failed to create consultation ticket"
    })
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={disabled}>
              <ClipboardPlus className="h-4 w-4" />
              <span className="sr-only">Create Consultation Ticket</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Create Consultation Ticket</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Create Consultation Ticket" 
        description="Fill in the fields below to create a new consultation ticket."
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
              defaultValue={subject}
              className="col-span-3"
            />
          </div>
          
          <div className="flex items-center gap-2 leading-none text-sm">
            <Checkbox
              checked={followConsultationTicket}
              onCheckedChange={(checked) => typeof checked === "boolean" && setFollowConsultationTicket(checked)}
            /> Open consultation ticket after creation
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <input ref={closeBtnRef} type="hidden"  value="ok"/>
            </DialogClose>
            <ActionButton form="consultation-ticket-form" type="submit">
            Create
            </ActionButton>
          </DialogFooter>
        </form>
      </CustomModalContent>
    </Dialog>
  )
}
