
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import Each from "@components/utils/Each";
import { upsertOrgSettingsAction } from "@actions/organizations/org-setting.action";
import { useOrgSetting } from "@hooks/useOrgSetting";
import { useParams } from "next/navigation";
import { toast } from "sonner";

type ConsultationSettingsForm = z.infer<typeof consultationSettingsForm>
const consultationSettingsForm = z.object({
  enableConsultation: z.boolean().default(true),
  noteTemplateId: z.number({
    coerce: true
  }),
})

export const ConsultationSettings = () => {
  const params = useParams<{organization: string}>()
  const {data: orgSetting, mutate} = useOrgSetting(params.organization)
  const form = useForm<ConsultationSettingsForm>({
    resolver: zodResolver(consultationSettingsForm),
    values: {
      enableConsultation: orgSetting?.data?.enableConsultation ?? false,
      noteTemplateId: orgSetting?.data?.Organization.OrgConsultationConfig?.NoteTemplateId ?? 0,
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      const orgSettingId = orgSetting?.data?.id ?? 0
      toast.promise(upsertOrgSettingsAction(orgSettingId, {
        orgUid: params.organization,
        enableConsultation: data.enableConsultation,
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultations</CardTitle>
        <CardDescription>
          Consultations related settings for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={action} className="w-full space-y-6">
            <FormField
              control={form.control}
              name="enableConsultation"
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
                    Enable Consultation management feature
                    </FormLabel>
                    <FormDescription>
                      Enable or disable the consultation management feature for your organization.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {
              form.watch("enableConsultation") &&
            (
              <>
                <Separator/>
                <FormField
                  control={form.control}
                  name="noteTemplateId"
                  render={({ field }) => (
                    <FormItem className="grow">
                      <FormLabel>
                        Consultation Note Template
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select note template to use." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <Each
                            of={[
                              {
                                id: 1,
                                name: "SOAPIE Note"
                              },
                              {
                                id: 2,
                                name: "SOAP Note"
                              }
                            ]}
                            render={(note) => (
                              <SelectItem value={note.id.toString()}>{note.name}</SelectItem>
                            )}
                          />
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This template will be used as the default note template for all consultations ticket.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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