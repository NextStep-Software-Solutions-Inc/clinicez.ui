"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import ActionButton from "@components/ActionButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import Each from "@components/utils/Each";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import PageLoading from "@components/PageLoading";
import { upsertOrgConsultationConfigAction } from "@actions/consultation/consultation-config.action";
import { useOrgConsultationConfig } from "@hooks/useOrgConsultationConfig";
import { useNoteTemplates } from "@hooks/useNoteTemplate";
import Suspend from "@components/Suspend";

type ConsultationSettingsForm = z.infer<typeof consultationSettingsForm>
const consultationSettingsForm = z.object({
  noteTemplateId: z.number({
    coerce: true
  }),
})

export const ConsultationSettings = () => {
  const params = useParams<{organization: string}>()
  const {data: orgConsultationConfig, mutate, isLoading} = useOrgConsultationConfig(params.organization)
  const {data: noteTemplates, isLoading: loadingTemplates} = useNoteTemplates()
  const form = useForm<ConsultationSettingsForm>({
    resolver: zodResolver(consultationSettingsForm),
    mode: "all",
    values: {
      noteTemplateId: orgConsultationConfig?.noteTemplateId ?? 0,
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      const configId = orgConsultationConfig?.id ?? 0
      toast.promise(upsertOrgConsultationConfigAction(configId, {
        orgUid: params.organization,
        noteTemplateId: data.noteTemplateId
      }), {
        loading: "Saving changes...",
        success: res => {
          if(res.status) {
            mutate(res.data),
            form.reset(data)
          }
          return res.message;
        },
        error: "Failed to save changes"
      })
    })();
  }
  
  if(isLoading && loadingTemplates) return <PageLoading label="Page loading, Please wait a moment..."/>
  return (
    <Suspend>
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
                name="noteTemplateId"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>
                    Consultation Note Template
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select note template to use."  />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <Each
                          of={noteTemplates ?? []}
                          render={(template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>{template.name}</SelectItem>
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
              <ActionButton type="submit">Save Changes</ActionButton>
            </form>
          </Form>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </Suspend>
  )
}