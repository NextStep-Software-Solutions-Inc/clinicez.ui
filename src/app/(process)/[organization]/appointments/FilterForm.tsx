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

const FilterFormSchema = z.object({
  appointmentTypeId: z.string({
    description: 'Select an appointment type',
  }).min(1, 'Appointment type is required'),
  serviceId: z.string({
    description: 'Select a service',
  }).min(1, 'Service is required'),
  doctorId: z.string({
    description: 'Select a doctor',
  }).min(1, 'Doctor is required')
})

const appointmentTypes = [
  {
    id: 1, 
    name: 'Consultation',
    services: [
      { id: 1, name: 'Dental Cleaning', doctors: [{ id: 1, name: 'Dr. Smith' }, { id: 2, name: 'Dr. Johnson' }] },
      { id: 2, name: 'Cavity Filling', doctors: [{ id: 2, name: 'Dr. Johnson' }, { id: 3, name: 'Dr. Williams' }] },
      { id: 3, name: 'Root Canal', doctors: [{ id: 3, name: 'Dr. Williams' }, { id: 4, name: 'Dr. Brown' }] },
      { id: 4, name: 'Tooth Extraction', doctors: [{ id: 4, name: 'Dr. Brown' }, { id: 5, name: 'Dr. Jones' }] },
      { id: 5, name: 'Dental Implants', doctors: [{ id: 5, name: 'Dr. Jones' }, { id: 6, name: 'Dr. Davis' }] },
      { id: 6, name: 'Orthodontics', doctors: [{ id: 6, name: 'Dr. Davis' }, { id: 7, name: 'Dr. Miller' }] },
      { id: 7, name: 'Other', doctors: [{ id: 7, name: 'Dr. Miller' }] },
    ]
  },
  {
    id: 2,
    name: 'Checkup',
    services: [
      { id: 8, name: 'Dental Cleaning', doctors: [{ id: 8, name: 'Dr. Wilson' }, { id: 9, name: 'Dr. Moore' }] },
      { id: 9, name: 'Cavity Filling', doctors: [{ id: 9, name: 'Dr. Moore' }, { id: 10, name: 'Dr. Taylor' }] },
      { id: 10, name: 'Root Canal', doctors: [{ id: 10, name: 'Dr. Taylor' }, { id: 11, name: 'Dr. Anderson' }] },
      { id: 11, name: 'Tooth Extraction', doctors: [{ id: 11, name: 'Dr. Anderson' }, { id: 12, name: 'Dr. Thomas' }] },
      { id: 12, name: 'Dental Implants', doctors: [{ id: 12, name: 'Dr. Thomas' }, { id: 13, name: 'Dr. Jackson' }] },
      { id: 13, name: 'Orthodontics', doctors: [{ id: 13, name: 'Dr. Jackson' }, { id: 14, name: 'Dr. White' }] },
      { id: 14, name: 'Other', doctors: [{ id: 14, name: 'Dr. White' }] },
    ]
  },
  {
    id: 3,
    name: 'Procedure',
    services: [
      { id: 15, name: 'Dental Cleaning', doctors: [{ id: 15, name: 'Dr. Harris' }, { id: 16, name: 'Dr. Martin' }] },
      { id: 16, name: 'Cavity Filling', doctors: [{ id: 16, name: 'Dr. Martin' }, { id: 17, name: 'Dr. Thompson' }] },
      { id: 17, name: 'Root Canal', doctors: [{ id: 17, name: 'Dr. Thompson' }, { id: 18, name: 'Dr. Garcia' }] },
      { id: 18, name: 'Tooth Extraction', doctors: [{ id: 18, name: 'Dr. Garcia' }, { id: 19, name: 'Dr. Martinez' }] },
      { id: 19, name: 'Dental Implants', doctors: [{ id: 19, name: 'Dr. Martinez' }, { id: 20, name: 'Dr. Robinson' }] },
      { id: 20, name: 'Orthodontics', doctors: [{ id: 20, name: 'Dr. Robinson' }, { id: 21, name: 'Dr. Clark' }] },
      { id: 21, name: 'Other', doctors: [{ id: 21, name: 'Dr. Clark' }] },
    ]
  }

];


export default function FilterForm() {
  const [bookAppointmentForm, setBookAppointmentForm] = useLocalStorage<z.infer<typeof FilterFormSchema>>("book-appointment-form", {
    appointmentTypeId: '',
    serviceId: '',
    doctorId: ''
  })
  const form = useForm<z.infer<typeof FilterFormSchema>>({
    resolver: zodResolver(FilterFormSchema),
    defaultValues: bookAppointmentForm,
  })
  const services = appointmentTypes.find(type => type.id.toString() === form.watch('appointmentTypeId'))?.services
  const doctors = services?.find(service => service.id.toString() === form.watch('serviceId'))?.doctors

  async function onSubmit(data: z.infer<typeof FilterFormSchema>) {
    await setBookAppointmentForm(data)
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
        <div className="flex flex-row gap-5 items-center flex-wrap">
          <FormField
            control={form.control}
            name="appointmentTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment Type</FormLabel>
                <Select 
                  onValueChange={val => {
                    form.resetField('serviceId')
                    return field.onChange(val)
                  }} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an appointment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={appointmentTypes}
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
              <FormItem>
                <FormLabel>Service</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
            name="doctorId"
            render={({ field }) => (
              <FormItem>
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
                        <SelectItem value={doctor.id.toString()}>{doctor.name}</SelectItem>
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
          <Button type="submit">Set Filter</Button>
        </div>
      </form>
    </Form>
  )
}
