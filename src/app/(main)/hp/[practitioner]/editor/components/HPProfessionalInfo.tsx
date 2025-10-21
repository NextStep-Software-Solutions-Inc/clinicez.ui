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
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { ProfessionalDetailsFormType, professionalDetailsSchema } from "../hp-form.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import ActionButton from "@components/ActionButton"
import { upsertProfessionalDetailsAction } from "@actions/hp.actions"
import { toast } from "sonner"
import React from "react"
import { useParams } from "next/navigation"
import { getMaxDate } from "@/lib/day-utils"

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
    mode: "all",
  })

  // Watch the licenseIssued field to set min date for licenseExpires
  const licenseIssuedDate = form.watch("licenseIssued")

  const action = async () => {
    form.handleSubmit(async (data) => {

      const payload = {
        ...data,
        healthcareProverId: practitioner
      }
      const latestProfDetails = await upsertProfessionalDetailsAction({
        where: { id: professionalDetailsId },
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

        <div className="flex flex-wrap gap-2">
          <FormField
            control={form.control}
            name="licenseIssued"
            render={({ field }) => (
              <FormItem className="flex-grow flex flex-col">
                <FormLabel>License Issued Date</FormLabel>
                <FormControl>
                  <Input
                    name={field.name}
                    onChange={e => field.onChange(new Date(e.target.value))}
                    defaultValue={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    type="date"
                    placeholder="Select date"
                    max={getMaxDate()}
                  />
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
            name="licenseExpires"
            render={({ field }) => (
              <FormItem className="flex-grow flex flex-col">
                <FormLabel>License Expiry  Date</FormLabel>
                <FormControl>
                  <Input
                    name={field.name}
                    onChange={e => field.onChange(new Date(e.target.value))}
                    defaultValue={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    type="date"
                    placeholder="Select date"
                    min={licenseIssuedDate ? format(new Date(licenseIssuedDate), "yyyy-MM-dd") : undefined}
                  />
                </FormControl>
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
        <ActionButton className="w-full" disabled={form.formState.isLoading}>Save Changes</ActionButton>
      </form>
    </Form>
  )
}

