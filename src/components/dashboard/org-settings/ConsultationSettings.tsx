
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import Each from "@components/utils/Each";

type ConsultationSettingsForm = z.infer<typeof consultationSettingsForm>
const consultationSettingsForm = z.object({
  enableConsultation: z.boolean().default(true),
  noteTemplateId: z.number({
    coerce: true
  }),
})

export const ConsultationSettings = () => {
  const form = useForm<ConsultationSettingsForm>({
    resolver: zodResolver(consultationSettingsForm),
    defaultValues: {
      
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      console.log(data)
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
                            of={["SOAPIE", "SOAP", "PIE", "SOAPR"]}
                            render={(value) => (
                              <SelectItem value={value}>{value}</SelectItem>
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