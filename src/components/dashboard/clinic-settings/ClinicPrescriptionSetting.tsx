"use client";

import { upsertClinicPrescriptionConfigAction } from "@/actions/medications/prescription-config.action";
import ActionButton from "@/components/ActionButton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Each from "@/components/utils/Each";
import { useClinicPrescriptionConfig } from "@/hooks/useClinicPrescriptionConfig";
import { useDocumentTemplates } from "@/hooks/useDocumentTemplate";
import { usePrescriptions } from "@/hooks/usePrescription";
import { promiseWrapper } from "@/lib/with-error-handling";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type PrescriptionSettingsForm = z.infer<typeof PrescriptionSettingsForm>
const PrescriptionSettingsForm = z.object({
  prescriptionTemplateId: z.number({
    coerce: true
  }),
})
export default function ClinicPrescriptionSetting() {
  const {clinicUid} = useParams<{clinicUid: string}>()
  const {data: clinicPrescriptionConfig, mutate, isLoading} = useClinicPrescriptionConfig(clinicUid)
  const {data: documentTemplates, isLoading: loadingTemplates} = useDocumentTemplates()
  const form = useForm<PrescriptionSettingsForm>({
    resolver: zodResolver(PrescriptionSettingsForm),
    mode: "all",
    values: {
      prescriptionTemplateId: clinicPrescriptionConfig?.data?.prescriptionTemplateId ?? 0,
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      const configId = clinicPrescriptionConfig?.data?.id ?? 0
      toast.promise(promiseWrapper(upsertClinicPrescriptionConfigAction)(configId, {
        clinicUid,
        prescriptionTemplateId: data.prescriptionTemplateId
      }), {
        loading: "Saving changes...",
        success: res => {
          mutate(),
          form.reset(data)
          return res.message;
        },
        error: error => error
      })
    })();
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prescription Settings</CardTitle>
        <CardDescription>
          Configure prescription settings for your clinic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={action} className="w-full space-y-6">
            <FormField
              control={form.control}
              name="prescriptionTemplateId"
              render={({ field }) => (
                <FormItem className="grow">
                  <FormLabel>
                  Prescription Template
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select prescription template to use."  />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={documentTemplates?.data ?? []}
                        render={(template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>{template.name}</SelectItem>
                        )}
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This template will be used as the default prescription template for all prescription ticket.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ActionButton type="submit">Save Changes</ActionButton>
          </form>
        </Form>

      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}