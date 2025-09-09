"use client";

import { promiseWrapper } from "@/lib/with-error-handling";
import { GetAppointment } from "@actions/appointments/appointments.action";
import { createConsultationTicketAction } from "@actions/consultation/consultation-ticket.action";
import { useUser } from "@auth0/nextjs-auth0";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip"
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClinicAppointment } from "@hooks/useAppointment";
import { useHPs } from "@hooks/useHP";
import { useSystems } from "@hooks/useSystem";
import { ClipboardPlus } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


type CreateConsultationTicketSchema = z.infer<typeof createConsultationTicketSchema>
const createConsultationTicketSchema = z.object({
  subject: z.string().optional(),
  systemId: z.coerce.number(),
  openTicket: z.boolean().optional(),
  hpId: z.coerce.number()
})

interface CreateConsultationTicketModalProps {
  disabled?: boolean
  subject: string
  appointment: NonNullable<GetAppointment["data"]>
}
export default function CreateConsultationTicketModal({disabled = false, subject, appointment}: CreateConsultationTicketModalProps) {
  const closeBtnRef = useRef<HTMLInputElement>(null)
  const router = useRouter();
  const {clinicUid} = useParams<{clinicUid: string}>();
  const searchParams = useSearchParams();
  const { user } = useUser()
  const {data: systems} = useSystems(clinicUid)
  const { data: myHps } = useHPs({
    userId: user?.sub ?? ""
  })

  const appointmentId = Number(searchParams.get("_appointment"))
  const {mutate} = useClinicAppointment({
    clinicUid,
    appointmentId
  })

  const form = useForm<CreateConsultationTicketSchema>({
    resolver: zodResolver(createConsultationTicketSchema),
    defaultValues: {
      subject,
      systemId: undefined,
      openTicket: false
    }
  })

  useEffect(() => {
    if(myHps?.length === 1) {
      form.setValue("hpId", myHps[0].id)
    }
    
  }, [form, myHps])


  const action = async () => {
    
    form.handleSubmit(async (data) => {
      const subject = data.subject
      const systemId = data.systemId
      const hpId = Number(data.hpId)
      const hpIds = new Set([hpId, ...appointment.AppointmentRouting.filter(r => r.status === "ACCEPTED").map(r => r.RoutedTo?.id!)])
      toast.promise(promiseWrapper(createConsultationTicketAction)({appointmentId, clinicUid, subject, systemId, hpIds : [...hpIds]}), {
        loading: "Creating consultation ticket...",
        success: (res) => {
          closeBtnRef.current?.click()
          mutate()
          data.openTicket && router.push(`/clinics/${clinicUid}/consultations/${res.data?.id}?${searchParams.toString()}`);
          return res.message
        },
        error: error => error
      })
    })()
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
        <Form {...form}>
          <form 
            action={action}
            id="consultation-ticket-form"
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="hpId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interacting as</FormLabel>
                  <Select onValueChange={field.onChange} name={field.name} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="HP profile to interact as" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={myHps ?? []}
                        render={(hp) => 
                          <SelectItem value={hp.id.toString()}>{hp.HPProfile?.title} {hp.HPProfile?.name} {hp.HPProfile?.suffix} ({hp.HPType.name})</SelectItem>}
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="systemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select system " />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={systems ?? []}
                        render={(system) => (
                          <SelectItem value={system.id.toString()}>{system.name}</SelectItem>
                        )}
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the system to create the consultation ticket for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a custom subject for the consultation ticket.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openTicket"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Open consultation ticket after creation
                    </FormLabel>
                    <FormDescription>
                      When checked, a consultation ticket will be opened after the creation of the ticket.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
        
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeBtnRef} type="hidden"  value="ok"/>
              </DialogClose>
              <ActionButton form="consultation-ticket-form" type="submit">
                Create
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  )
}
