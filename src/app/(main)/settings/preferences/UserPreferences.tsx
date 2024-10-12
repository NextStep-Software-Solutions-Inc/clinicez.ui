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

import {toast} from "sonner"
import { setMyDefaultOrganizationAction } from "@actions/organizations/organization.action"
import ActionButton from "@components/ActionButton"
import { Checkbox } from "@components/ui/checkbox"
import { GetMyUserPreference, upsertMyUserPreference } from "@actions/users/preference.action"


const UserPreferenceFormSchema = z.object({
  userPreferenceId: z.number().optional(),
  autoAcceptAppointmentAssignment: z.boolean().default(false),
  autoAssignAppointmentToSelf: z.boolean().default(false),
})


interface UserPreferenceFormProps {
  userPreference: GetMyUserPreference["data"]
}
export default function UserPreferences({userPreference}: UserPreferenceFormProps){
  const form = useForm({
    resolver: zodResolver(UserPreferenceFormSchema),
    values: {
      userPreferenceId: userPreference?.id ?? 0,
      autoAcceptAppointmentAssignment: userPreference?.autoAcceptAppointmentAssignment ?? false,
      autoAssignAppointmentToSelf: userPreference?.autoAssignAppointmentToSelf ?? false
    }
  })
  async function action(){
    form.handleSubmit(async (data)  => {
      toast.promise(upsertMyUserPreference(data), {
        loading: "Updating user preferences...",
        success: (res) => {
          if(res.status) {
            form.reset(data)
          }
          return res.message
        },
        error: "An error occurred while updating user preferences."
      })
    })()
  } 
  return (
    <Form {...form}>
      <form action={action} className="space-y-8">
        <FormField
          control={form.control}
          name="autoAcceptAppointmentAssignment"
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
                Auto-accept assigned appointments
                </FormLabel>
                <FormDescription>
                Automatically accept appointments assigned to you.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="autoAssignAppointmentToSelf"
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
                Auto-assign appointments to self
                </FormLabel>
                <FormDescription>
                Automatically assign appointments to yourself when receiving them.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        {
          form.formState.isDirty && (
            <ActionButton>Save Changes</ActionButton>
          )
        }
      </form>
    </Form>
  )
}