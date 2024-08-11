"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@components/ui/button"
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
import { toast } from "@components/ui/use-toast"
import Each from "@components/utils/Each"
import { useLocalStorage } from "@hooks/useLocalStorage"
import { useOrgAppointmentTypes } from "@hooks/useOrgAppointmentType"
import { useParams } from "next/navigation"
import { useHPs } from "@hooks/useHP"
import { useOrgServices } from "@hooks/useOrgService"
import { bookAppointmentAtom, BookAppointmentForm } from "../../../../../state/book-appointment"
import { useAtom } from "jotai"
import ActionButton from "@components/ActionButton"

const FilterFormSchema = z.object({
  appointmentTypeId: z.coerce.number({
    description: 'Select an appointment type',
  }).min(1, 'Appointment type is required'),
  serviceId: z.coerce.number({
    description: 'Select a service',
  }).optional(),
  doctor: z.string({
    description: 'Select a doctor',
  }).optional()
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
    defaultValues: bookAppointmentForm,
  })

  async function onSubmit(data: z.infer<typeof FilterFormSchema>) {
    setBookAppointmentForm((prev) => ({...prev, ...data}))
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
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
                  onValueChange={val => {
                    form.resetField('serviceId')
                    return field.onChange(val)
                  }} 
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
            name="doctor"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>Doctor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={doctors ?? []}
                      render={(doctor) => (
                        <SelectItem value={doctor.id.toString()}>{doctor.DoctorProfile?.name} </SelectItem>
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
          <ActionButton className="w-full" type="submit">Set Filter</ActionButton>

        </div>
      </form>
    </Form>
  )
}
