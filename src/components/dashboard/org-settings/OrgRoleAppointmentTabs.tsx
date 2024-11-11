"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { useParams } from "next/navigation";
import { toast } from "sonner";
import PageLoading from "@components/PageLoading";
import {useOrgAppointmentTabs } from "@hooks/useAppointmentTab";
import Each from "@components/utils/Each";
import { setClinicRoleAppointmentTabsAction } from "@actions/organizations/clinic-appointment-tab..action";


const FormSchema = z.object({
  orgTabIds: z.array(z.number()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
})
  
  interface OrgRoleAppointmentTabsProps {
    orgRoleTabId: number
    currentOrgTabIds: number[]
  }
export default function OrgRoleAppointmentTabs({orgRoleTabId, currentOrgTabIds}:OrgRoleAppointmentTabsProps ) {
  const params = useParams<{organization: string}>()
  const {data: orgAppointmentTabs ,isLoading} = useOrgAppointmentTabs(params.organization)
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values: {
      orgTabIds: currentOrgTabIds,
    },
  })
  
  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(setClinicRoleAppointmentTabsAction(orgRoleTabId, data.orgTabIds), {
        loading: "Saving changes...",
        success: res => {
          return res.message
        },
        error: "Error while saving changes",
      })
    })();
  }
  
  if(isLoading) return <p>Loading page, please wait a moment...</p>
  return (
    <Form {...form}>
      <form action={action} className="space-y-8">
        <FormField
          control={form.control}
          name="orgTabIds"
          render={() => (
            <FormItem>
              <div className="mb-4 ">
                <FormLabel className="text-base font-medium">Select Visible Appointment Tabs</FormLabel>
                <FormDescription>
                    Choose the tabs you want to display on the appointment page for this role.
                </FormDescription>
              </div>
              <div className="mb-4 flex gap-3 flex-wrap items-center">
                <Each
                  of={orgAppointmentTabs?.data ?? []}
                  render={(tab) => {
                    return (
                      <FormField
                        key={tab.id}
                        control={form.control}
                        name="orgTabIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={tab.id}
                              className="flex flex-row items-start space-x-2 space-y-0"
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
                                {tab.AppointmentTab.name}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    )
                  }}
                />
              </div>
                    
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
  )
}