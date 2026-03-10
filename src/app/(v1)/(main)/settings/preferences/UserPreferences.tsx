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

import { toast } from "sonner"
import ActionButton from "@components/ActionButton"
import { Checkbox } from "@components/ui/checkbox"
import { GetMyUserPreference, upsertMyUserPreference } from "@actions/users/preference.action"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import Each from "@components/utils/Each"
import { useHPs } from "@hooks/useHP"
// import { useUser } from "@clerk/nextjs" // Commented out for Clerk migration
import { useUser } from "@clerk/nextjs"
import { promiseWrapper } from "@/lib/with-error-handling"


const UserPreferenceFormSchema = z.object({
  userPreferenceId: z.number().optional(),
  autoAcceptAppointmentAssignment: z.boolean().default(false),
  autoAssignAppointmentToSelf: z.boolean().default(false),
  muteNotifications: z.boolean().default(false),
  defaultHpId: z.number({
    coerce: true,
    message: "Please select a default health care provider."
  }).optional()
}).superRefine((data, ctx) => {
  if (data.autoAssignAppointmentToSelf && !data.defaultHpId) {
    ctx.addIssue({
      message: "Please select a default health care provider.",
      code: "custom",
      path: ["defaultHpId"],
    })
  }
})


interface UserPreferenceFormProps {
  userPreference: GetMyUserPreference["data"]
}
export default function UserPreferences({ userPreference }: UserPreferenceFormProps) {
  const { user } = useUser()
  const { data: myHps } = useHPs({
    userId: user?.id ?? undefined
  })
  const form = useForm({
    resolver: zodResolver(UserPreferenceFormSchema),
    values: {
      userPreferenceId: userPreference?.id ?? 0,
      autoAcceptAppointmentAssignment: userPreference?.autoAcceptAppointmentAssignment ?? false,
      autoAssignAppointmentToSelf: userPreference?.autoAssignAppointmentToSelf ?? false,
      muteNotifications: userPreference?.muteNotifications ?? false,
      defaultHpId: userPreference?.HealthCareProvider?.id
    }
  })



  async function action() {
    form.handleSubmit(async (data) => {
      toast.promise(promiseWrapper(upsertMyUserPreference)(data), {
        loading: "Updating user preferences...",
        success: (res) => {
          form.reset(data)
          return res.message
        },
        error: (error) => error
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
          form.watch("autoAssignAppointmentToSelf") && (
            <FormField
              control={form.control}
              name="defaultHpId"
              render={({ field }) => {
                return (
                  <FormItem className="flex-grow">
                    <FormLabel htmlFor="officeId">Assign to this HP profile</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an office" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <Each
                            of={myHps ?? []}
                            render={(hp) => (
                              <SelectItem key={hp.id} value={hp.id.toString()}>{hp.HPProfile?.title} {hp.HPProfile?.name} {hp.HPProfile?.suffix} (<span className="italic font-medium">{hp.HPType.name.toLocaleLowerCase()}</span>)</SelectItem>
                            )}
                          />
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Assign appointments to this HP profile when auto-assigning to self.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          )
        }
        <FormField
          control={form.control}
          name="muteNotifications"
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
                  Mute notifications
                </FormLabel>
                <FormDescription>
                  Stop receiving in-app notifications. You can re-enable them at any time.
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