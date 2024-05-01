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
      { id: 1, name: 'Dental Cleaning' },
      { id: 2, name: 'Cavity Filling' },
      { id: 3, name: 'Root Canal' },
      { id: 4, name: 'Tooth Extraction' },
      { id: 5, name: 'Dental Implants' },
      { id: 6, name: 'Orthodontics' },
      { id: 7, name: 'Other' },
    ]
  },
  {
    id: 2,
    name: 'Checkup',
    services: [
      { id: 8, name: 'Dental Cleaning' },
      { id: 9, name: 'Cavity Filling' },
      { id: 10, name: 'Root Canal' },
      { id: 11, name: 'Tooth Extraction' },
      { id: 12, name: 'Dental Implants' },
      { id: 13, name: 'Orthodontics' },
      { id: 14, name: 'Other' },
    ]
  },
  {
    id: 3,
    name: 'Procedure',
    services: [
      { id: 15, name: 'Dental Cleaning' },
      { id: 16, name: 'Cavity Filling' },
      { id: 17, name: 'Root Canal' },
      { id: 18, name: 'Tooth Extraction' },
      { id: 19, name: 'Dental Implants' },
      { id: 20, name: 'Orthodontics' },
      { id: 21, name: 'Other' },
    ]
  }

]


export default function FilterForm() {
  const form = useForm<z.infer<typeof FilterFormSchema>>({
    resolver: zodResolver(FilterFormSchema)
  })
  const services = appointmentTypes.find(type => type.id.toString() === form.watch('appointmentTypeId'))?.services

  function onSubmit(data: z.infer<typeof FilterFormSchema>) {
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
                      of={services ?? []}
                      render={(service) => (
                        <SelectItem value={service.id.toString()}>{service.name}</SelectItem>
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
