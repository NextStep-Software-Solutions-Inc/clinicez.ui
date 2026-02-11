"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import ActionButton from "@components/ActionButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import PageLoading from "@components/PageLoading";
import { Badge } from "@components/ui/badge";
import dayjs from "@lib/day-utils";
import { promiseWrapper } from "@/lib/with-error-handling";
import { useClinicSetting } from "@/hooks/useClinicSetting";
import { updatePhilHealthSettingsAction } from "@actions/clinics/clinic-setting.action";

const philHealthSettingsForm = z.object({
  philhealthAccreditationNumber: z.string().trim().optional(),
  facilityName: z.string().trim().optional(),
})

type PhilHealthSettingsForm = z.infer<typeof philHealthSettingsForm>

export default function PhilHealthSettings() {

  const {clinicUid} = useParams<{clinicUid: string}>()

  const {data: clinicSetting, isLoading, mutate} = useClinicSetting(clinicUid)
    
  const form = useForm<PhilHealthSettingsForm>({
    resolver: zodResolver(philHealthSettingsForm),
    values: {
      philhealthAccreditationNumber: clinicSetting?.data?.philhealthAccreditationNumber ?? "",
      facilityName: clinicSetting?.data?.facilityName ?? "",
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(promiseWrapper(updatePhilHealthSettingsAction)(clinicUid, data), {
        loading: "Saving PhilHealth settings...",
        success: (res) => {
          mutate()
          form.reset(data)
          return res.message;
        },
        error: (error) => error?.message || "Failed to update PhilHealth settings. Please try again.",
        position: "top-center"
      })
    })();
  }
  
  if(isLoading) return <PageLoading label="Loading PhilHealth settings..."/>
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>PhilHealth Information</CardTitle>
        <CardDescription>
          Configure PhilHealth accreditation details for your clinic. These values will be used in PhilHealth forms (SAP, EKAS, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={action} className="w-full space-y-6">
            <FormField
              control={form.control}
              name="philhealthAccreditationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PhilHealth Accreditation Number (PAN)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter PhilHealth Accreditation Number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The PhilHealth Accreditation Number assigned to your clinic. This will appear on SAP and EKAS forms.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facilityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konsulta Facility Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter facility name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The official facility name as registered with PhilHealth. This will appear on SAP forms.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {
              form.formState.isDirty &&
              <ActionButton type="submit">Save PhilHealth Settings</ActionButton>
            }
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        {
          clinicSetting?.data?.Clinic?.updatedAt && 
          (
            <Badge variant="secondary">
              Updated last {dayjs(clinicSetting.data.Clinic.updatedAt).fromNow()}
            </Badge>
          )
        }
      </CardFooter>
    </Card>
  )
}
