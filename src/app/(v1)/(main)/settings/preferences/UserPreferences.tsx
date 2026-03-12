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
import { NotificationType } from "@prisma/client"
import { Separator } from "@components/ui/separator"


const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  APPOINTMENT_CREATED: "Appointment submitted",
  APPOINTMENT_CONFIRMED: "Appointment confirmed",
  APPOINTMENT_CANCELLED: "Appointment cancelled",
  APPOINTMENT_REJECTED: "Appointment rejected",
  APPOINTMENT_COMPLETED: "Appointment completed",
  APPOINTMENT_RESCHEDULED: "Appointment rescheduled",
  APPOINTMENT_RECEIVED: "New appointment received at your clinic",
  CONSULTATION_STARTED: "Consultation started",
  CONSULTATION_COMPLETED: "Consultation completed",
  DIAGNOSTIC_ISSUED: "Diagnostic result issued",
  PRESCRIPTION_ISSUED: "Prescription issued",
  MEDICAL_CERTIFICATE_ISSUED: "Medical certificate issued",
  REFERRAL_ISSUED: "Referral issued",
  ORG_MEMBERSHIP_APPLIED: "Organization membership applied",
  ORG_MEMBERSHIP_APPROVED: "Organization membership approved",
  ORG_MEMBERSHIP_REJECTED: "Organization membership rejected",
  ORG_MEMBERSHIP_SUSPENDED: "Organization membership suspended",
  ORG_MEMBERSHIP_DEACTIVATED: "Organization membership deactivated",
  FILE_SHARED: "File shared with you",
  VERIFICATION_SUBMITTED: "Verification request submitted",
  VERIFICATION_APPROVED: "Verification approved",
  VERIFICATION_REJECTED: "Verification rejected",
  VERIFICATION_RESET: "Verification reset",
}

const ALL_NOTIFICATION_TYPES = Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]

const UserPreferenceFormSchema = z.object({
  userPreferenceId: z.number().optional(),
  autoAcceptAppointmentAssignment: z.boolean().default(false),
  autoAssignAppointmentToSelf: z.boolean().default(false),
  muteNotifications: z.boolean().default(false),
  subscribedNotificationTypes: z.array(z.nativeEnum(NotificationType)).default([]),
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
      subscribedNotificationTypes: userPreference?.subscribedNotificationTypes?.length
        ? userPreference.subscribedNotificationTypes
        : ALL_NOTIFICATION_TYPES,
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

  const subscribedTypes = form.watch("subscribedNotificationTypes")
  const isMuted = form.watch("muteNotifications")

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

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-1">Notification preferences</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Choose which notifications you want to receive. When none are selected you will receive all notifications.
          </p>
          <FormField
            control={form.control}
            name="muteNotifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Mute all notifications
                  </FormLabel>
                  <FormDescription>
                    Stop receiving in-app notifications. You can re-enable them at any time.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {!isMuted && (
            <FormField
              control={form.control}
              name="subscribedNotificationTypes"
              render={() => (
                <FormItem className="rounded-md border p-4 space-y-3">
                  <div>
                    <FormLabel>Subscribe to specific notification types</FormLabel>
                    <FormDescription>
                      Select the notification types you want to receive. Leave all unchecked to receive every type.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_NOTIFICATION_TYPES.map((type) => {
                      const checkboxId = `notif-sub-${type}`
                      return (
                        <FormItem
                          key={type}
                          className="flex flex-row items-center space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              id={checkboxId}
                              checked={subscribedTypes.includes(type)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  form.setValue(
                                    "subscribedNotificationTypes",
                                    [...subscribedTypes, type],
                                    { shouldDirty: true },
                                  )
                                } else {
                                  form.setValue(
                                    "subscribedNotificationTypes",
                                    subscribedTypes.filter((t) => t !== type),
                                    { shouldDirty: true },
                                  )
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel htmlFor={checkboxId} className="font-normal text-sm cursor-pointer">
                            {NOTIFICATION_TYPE_LABELS[type]}
                          </FormLabel>
                        </FormItem>
                      )
                    })}
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>

        {
          form.formState.isDirty && (
            <ActionButton>Save Changes</ActionButton>
          )
        }
      </form>
    </Form>
  )
}