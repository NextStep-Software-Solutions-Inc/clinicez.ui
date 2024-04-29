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

import {toast} from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import Each from "@components/utils/Each"

const organizationFormSchema = z.object({
  organizationId: z.string(),
})

type GeneraSettingsFormValues = z.infer<typeof organizationFormSchema>

const myOrganizations = [
  {
    id: "1",
    uid: "hims",
    name: "Healthcare Information Management System",
  },
  {
    id: "2",
    uid: "cums",
    name: "Capitol University Medical Center",
  }
]

export default function OrganizationsSettings() {
  
  const form = useForm<GeneraSettingsFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      organizationId: myOrganizations[0].id,
    }
  })

  function onSubmit(data: GeneraSettingsFormValues) {
    toast("You submitted the following values")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="organizationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Organization</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <Each
                    of={myOrganizations}
                    render={({ id, uid, name }) => (
                      <SelectItem value={id}>{name}</SelectItem>
                    )}
                  />
                </SelectContent>
              </Select>
              <FormDescription>
                This will the default organization that will be used when you open your dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={!form.formState.isDirty} type="submit">Update</Button>
      </form>
    </Form>
  )
}
