"use client"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { Input } from "@components/ui/input"
import {  useForm } from "react-hook-form"
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover"
import { Button } from "../../../../../../../components/ui/button"
import { cn } from "@lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../../../../../../../components/ui/calendar"
import { ProfessionalDetailsFormType, professionalDetailsSchema } from "../hp-form.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import ActionButton from "@components/ActionButton"
import { upsertProfessionalDetailsAction } from "@actions/hp.actions"
import { toast } from "sonner"
import React from "react"
import { useParams } from "next/navigation"

type HPProfessionalInfoProps = {
  professionalDetails: ProfessionalDetailsFormType | null
}

export default function HPProfessionalInfo({ professionalDetails }: HPProfessionalInfoProps) {
  const params = useParams() as { practitioner: string }
  const [professionalDetailsId, setProfessionalDetailsId] = React.useState<number | undefined>(professionalDetails?.id ?? 0)
  const practitioner = parseInt(params.practitioner)
  const form = useForm<ProfessionalDetailsFormType>({
    resolver: zodResolver(professionalDetailsSchema),
    defaultValues: professionalDetails || {},
  })

  const action = async () => {
    form.handleSubmit(async (data) => {

      const payload = {
        ...data,
        healthcareProverId: practitioner
      }
      const latestProfDetails = await upsertProfessionalDetailsAction({
        where: {id: professionalDetailsId},
        create: payload,
        update: payload,
      })
      setProfessionalDetailsId(latestProfDetails.id)
      form.reset(data)
      toast.success("Professional Details updated successfully")
    })()
  }

  return (
    <Form {...form}>
      <form action={action} className="prose max-w-full space-y-8 shadow-2xl w-full p-8 bg-white rounded-md">
        <h4>Professional Information <span className="text-xs italic">(Private)</span></h4>
        <p className="text-sm italic">
          Please ensure that you are providing accurate information for validation. 
          Your information will be verified before your profile is published.
        </p>
        <FormField
          control={form.control}
          name="licenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Number</FormLabel>
              <FormControl>
                <Input placeholder="Your License Number" {...field} />
              </FormControl>
              <FormDescription>
                This is going to be used internally (Private).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="licenseIssued"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>License Issued Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  This is going to be used internally (Private).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="licenseExpires"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>License Expiry  Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  This is going to be used internally (Private).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="ptrNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PTR Number</FormLabel>
              <FormControl>
                <Input placeholder="Your PTR Number" {...field} />
              </FormControl>
              <FormDescription>
                This is going to be used internally (Private).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Number</FormLabel>
              <FormControl>
                <Input placeholder="Your TIN or Tax Number" {...field} />
              </FormControl>
              <FormDescription>
                This is going to be used internally (Private).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.isDirty && <ActionButton className="w-full" disabled={!form.formState.isValid}>Save Changes</ActionButton>}
      </form>
    </Form>
  )
}

