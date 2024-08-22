"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import Each from "@components/utils/Each"
import { useOrgAppointmentTypes } from "@hooks/useOrgAppointmentType"
import { useParams } from "next/navigation"
import { useHPs } from "@hooks/useHP"
import { useOrgServices } from "@hooks/useOrgService"
import { bookAppointmentAtom } from "../../../../../state/book-appointment"
import { useAtom } from "jotai"
import ActionButton from "@components/ActionButton"
import { generateTimeSlots } from "@actions/schedule/time-slot.actions"
import { toast } from "sonner"

const FilterFormSchema = z.object({
  appointmentTypeId: z.coerce.number({
    description: 'Select an appointment type',
  }).min(1, 'Appointment type is required'),
  serviceId: z.coerce.number({
    description: 'Select a service',
  }),
  hpEmail: z.string({
    description: 'Select a doctor',
  }),
})


export default function FilterForm() {
  const params = useParams()
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom)

  const organization = params?.organization as string
  const {data: appointmentTypes} = useOrgAppointmentTypes(organization)
  const {data: services} = useOrgServices({
    orgUid: organization,
  })
  const {data: doctors} = useHPs({type: "DOCTOR",})

  const form = useForm<z.infer<typeof FilterFormSchema>>({
    resolver: zodResolver(FilterFormSchema),
    defaultValues: {
      appointmentTypeId: bookAppointmentForm.appointmentTypeId,
      serviceId: bookAppointmentForm.serviceId,
      hpEmail: bookAppointmentForm.hpEmail
    },
  })

  async function onSubmit(data: z.infer<typeof FilterFormSchema>) {
    
    const service = services?.find(service => service.id === data.serviceId)
    const appointmentType = appointmentTypes?.find(appointmentType => appointmentType.id === data.appointmentTypeId)
    const serviceAttribute = service?.ServiceAttribute
    const appointmentTypeAttribute = appointmentType?.AppointmentTypeAttribute 
    
    if(!serviceAttribute || !appointmentTypeAttribute) return toast.message("Service or appointment type attribute not found")

    setBookAppointmentForm((prev) => ({...prev, ...{
      selectedTimeSlot: undefined,
      availabilities: undefined,
      hpEmail: data.hpEmail,
      serviceId: data.serviceId,
      appointmentTypeId: data.appointmentTypeId
    }}))

    form.reset(data)
    toast.promise(generateTimeSlots({
      appointmentTypeId: data.appointmentTypeId,
      serviceId: data.serviceId,
      hpEmail: data.hpEmail
    }), {
      loading: "Generating time slots...",
      success: (res) => {
        if(res.status === false) return res.message
        setBookAppointmentForm((prev) => ({...prev, availabilities: res.data}))
        return "Time slots generated"
      },
      error: "Failed to generate time slots",
      position: "top-center"
    });
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className=" space-y-6">
        <div className="flex flex-row gap-5 items-center justify-center md:justify-start flex-wrap">
          <FormField
            control={form.control}
            name="appointmentTypeId"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>Appointment Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an appointment" className="capitalize"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={appointmentTypes ?? []}
                      render={(appointmentType) => (
                        <SelectItem value={appointmentType.id.toString()}>{appointmentType.name}</SelectItem>
                      )}
                    />
                  </SelectContent>
                </Select>
                <FormDescription>
                    Select an appointment type to show available slots
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>Service</FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={services ?? []}
                      render={(service) => (
                        <SelectItem value={service.id.toString()}>{service.name}</SelectItem>
                      )}
                    />
                  </SelectContent>
                </Select>
                <FormDescription>
                    Select a service to filter even more available appointments
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hpEmail"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>Healthcare Provider</FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a healthcare provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={doctors ?? []}
                      render={(doctor) => (
                        <SelectItem value={doctor.User.email}>{doctor.DoctorProfile?.title} {doctor.DoctorProfile?.name} {doctor.DoctorProfile?.suffix}</SelectItem>
                      )}
                    />
                  </SelectContent>
                </Select>
                <FormDescription>
                    Select a doctor to show their vacant slots
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <ActionButton className="w-full" type="submit" disabled={!form.formState.isDirty}>Get Time Slots</ActionButton>

        </div>
      </form>
    </Form>
  )
}

const findTheHighest = (arr: number[]) => {
  return Math.max(...arr);
}