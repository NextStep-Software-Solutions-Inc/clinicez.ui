"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import ActionButton from "@components/ActionButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Label } from "@components/ui/label";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { useParams } from "next/navigation";
import { toast } from "sonner";
import PageLoading from "@components/PageLoading";
import { upsertOrgAppointmentConfigAction } from "@actions/appointments/appointment-config.action";
import { useOrgAppointmentConfig } from "@hooks/useOrgAppointmentConfig";

type AppointmentSettingsForm = z.infer<typeof appointmentSettingsForm>
const appointmentSettingsForm = z.object({
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

export default function AppointmentSettings(){
  const params = useParams<{organization: string}>()
  const {data: orgAppointmentConfig, mutate, isLoading} = useOrgAppointmentConfig(params.organization)
  const form = useForm<AppointmentSettingsForm>({
    resolver: zodResolver(appointmentSettingsForm),
    mode:"onChange",
    values: {
      maxAppointmentsPerClient: orgAppointmentConfig?.maxAppointmentsPerClient ?? 0,
      perClientResetInterval: orgAppointmentConfig?.perClientResetInterval ?? 0,
      maxAppointmentsPerDay: orgAppointmentConfig?.maxAppointmentsPerDay ?? 0,
      perDayResetInterval: orgAppointmentConfig?.perDayResetInterval ?? 0,
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      const configId = orgAppointmentConfig?.id ?? 0
      toast.promise(upsertOrgAppointmentConfigAction(configId, {
        orgUid: params.organization,
        maxAppointmentsPerClient: data.maxAppointmentsPerClient,
        perClientResetInterval: data.perClientResetInterval,
        maxAppointmentsPerDay: data.maxAppointmentsPerDay,
        perDayResetInterval: data.perDayResetInterval
      }), {
        loading: "Saving changes...",
        success: res => {
          if(res.status) {
            mutate(res.data)
            form.reset(data)
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
                    The maximum number of appointments that can be made per day for the organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />                  
            <div className="flex flex-wrap gap-2 items-center">
              <FormField
                control={form.control}
                name="maxAppointmentsPerClient"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>
                      Appointments quota per client in a day
                    </FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" {...field} />
                    </FormControl>
                    <FormDescription>
                      The maximum number of appointments that can be made per client in a day.
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
                      How many day(s) after the last reset
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
                Last reset: {orgAppointmentConfig?.lastPerClientIntervalReset && dayjs(orgAppointmentConfig.lastPerClientIntervalReset).fromNow()}
              </Label>
            </div>
           
            {
              form.formState.isDirty &&
              <ActionButton type="submit">Save Changes</ActionButton>
            }
          </form>
        </Form>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}