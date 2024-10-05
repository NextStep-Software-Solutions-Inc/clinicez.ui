"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { Label } from "@components/ui/label";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { useOrgSetting } from "@hooks/useOrgSetting";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { upsertOrgSettingsAction } from "@actions/organizations/org-setting.action";
import PageLoading from "@components/PageLoading";

type AppointmentSettingsForm = z.infer<typeof generalSettingsForm>
const generalSettingsForm = z.object({
  enableAppointment: z.boolean().default(true),
  maxAppointmentsPerClient: z.number({
    coerce: true
  }).min(0),
  perClientResetInterval: z.number({
    coerce: true
  }).min(0),
  maxAppointmentsPerDay: z.number({
    coerce: true
  }).min(0),
  perDayResetInterval: z.number({
    coerce: true
  }).min(0),
})

export const AppointmentSettings = () => {
  const params = useParams<{organization: string}>()
  const {data: orgSetting, mutate, isLoading} = useOrgSetting(params.organization)
  const form = useForm<AppointmentSettingsForm>({
    resolver: zodResolver(generalSettingsForm),
    mode:"onChange",
    values: {
      enableAppointment: orgSetting?.data?.enableAppointment ?? false,
      maxAppointmentsPerClient: orgSetting?.data?.Organization.OrgAppointmentConfig?.maxAppointmentsPerClient ?? 0,
      perClientResetInterval: orgSetting?.data?.Organization.OrgAppointmentConfig?.perClientResetInterval ?? 0,
      maxAppointmentsPerDay: orgSetting?.data?.Organization.OrgAppointmentConfig?.maxAppointmentsPerDay ?? 0,
      perDayResetInterval: orgSetting?.data?.Organization.OrgAppointmentConfig?.perDayResetInterval ?? 0,
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      const orgSettingId = orgSetting?.data?.id ?? 0
      toast.promise(upsertOrgSettingsAction(orgSettingId, {
        orgUid: params.organization,
        enableAppointment: data.enableAppointment,
      }), {
        loading: "Saving changes...",
        success: res => {
          if(res.status) {
            mutate(res)
          }
          return res.message;
        },
        error: "Failed to save changes"
      })
    })();
  }
  if(isLoading) return <PageLoading label="Page loading, Please wait a moment..."/>
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
        <CardDescription>
            Appointment related settings for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={action} className="w-full space-y-6">
            <FormField
              control={form.control}
              name="enableAppointment"
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
                    Enable Appointments management feature
                    </FormLabel>
                    <FormDescription>
                    Enable or disable the appointment management feature for your organization.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {
              form.watch("enableAppointment") &&
            (
              <>
                <Separator/>
                <FormField
                  control={form.control}
                  name="maxAppointmentsPerDay"
                  render={({ field }) => (
                    <FormItem className="grow">
                      <FormLabel>
                          Appointments quota per day
                      </FormLabel>
                      <FormControl>
                        <Input type="number" inputMode="numeric" {...field} />
                      </FormControl>
                      <FormDescription>
                        The maximum number of appointments that can be made per day.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator/>
                  
                <div className="flex flex-wrap gap-2 items-center">
                  <FormField
                    control={form.control}
                    name="maxAppointmentsPerClient"
                    render={({ field }) => (
                      <FormItem className="grow">
                        <FormLabel>
                          Appointments quota per client
                        </FormLabel>
                        <FormControl>
                          <Input type="number" inputMode="numeric" {...field} />
                        </FormControl>
                        <FormDescription>
                          The maximum number of appointments that can be made per client.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perClientResetInterval"
                    render={({ field }) => (
                      <FormItem className="grow">
                        <FormLabel>
                          How many day after the last reset
                        </FormLabel>
                        <FormControl>
                          <Input type="number" inputMode="numeric" {...field} />
                        </FormControl>
                        <FormDescription>
                          The number of days after the last reset before the per client interval will be reset.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Label>
                    Last reset: {orgSetting?.data?.Organization.OrgAppointmentConfig?.lastPerClientIntervalReset && dayjs(orgSetting.data.Organization.OrgAppointmentConfig.lastPerClientIntervalReset).fromNow()}
                  </Label>
                </div>
              </>
            )}
            <ActionButton type="submit">Save Changes</ActionButton>
          </form>
        </Form>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}