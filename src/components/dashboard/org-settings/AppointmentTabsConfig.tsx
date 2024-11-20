"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import dayjs from "@lib/day-utils";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import PageLoading from "@components/PageLoading";
import { useAppointmentTabs, useClinicAppointmentTabs } from "@hooks/useAppointmentTab";
import Each from "@components/utils/Each";
import { setClinicAppointmentTabsAction } from "@/actions/clinics/clinic-appointment-tab..action";


const FormSchema = z.object({
  tabIds: z.array(z.number()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
})
  
export default function AppointmentTabsConfig() {
  const params = useParams<{orgUid: string}>()
  const {data: appointmentTabs, isLoading: loadingAppointmentTabs} = useAppointmentTabs()
  const {data: orgAppointmentTabs ,isLoading} = useClinicAppointmentTabs(String(params?.orgUid))
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values: {
      tabIds: orgAppointmentTabs?.data.map((tab) => tab.AppointmentTab.id) ?? [],
    },
  })
    
  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(setClinicAppointmentTabsAction(String(params?.orgUid), data.tabIds), {
        loading: "Saving changes...",
        success: res => {
          if(res.status) {
            form.reset(data)
          }
          return res.message;
        },
        error: "Failed to save changes"
      })
    })();
  }
  
  if(isLoading && loadingAppointmentTabs) return <PageLoading label="Page loading, Please wait a moment..."/>
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment Tabs Configuration</CardTitle>
        <CardDescription>
            Appointment related settings for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={action} className="space-y-8">
            <FormField
              control={form.control}
              name="tabIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Select the appointment tabs</FormLabel>
                    <FormDescription>
                    Choose the tabs you want to display on the appointment page.
                    </FormDescription>
                  </div>
                  <Each
                    of={appointmentTabs ?? []}
                    render={(tab) => {
                      return (
                        <FormField
                          key={tab.id}
                          control={form.control}
                          name="tabIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={tab.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(tab.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, tab.id])
                                        : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== tab.id
                                          )
                                        )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal capitalize">
                                  {tab.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      )
                    }}
                  />
                    
                  <FormMessage />
                </FormItem>
              )}
            />
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