
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import { Textarea } from "@components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { useClinic } from "@/hooks/useClinic";
import { useParams } from "next/navigation";
import { updateClinicAction } from "@actions/clinics/clinic.action";
import { toast } from "sonner";
import PageLoading from "@components/PageLoading";
import { Badge } from "@components/ui/badge";
import dayjs from "@lib/day-utils";
import { promiseWrapper } from "@/lib/with-error-handling";

type ClinicGeneralSettingsForm = z.infer<typeof generalSettingsForm>
const generalSettingsForm = z.object({
  clinicUid: z.string({
    required_error: "Clinic unique ID is required"
  }).trim().readonly(),
  name: z.string({
    required_error: "Clinic name is required"
  }).trim().readonly(),
  description: z.string().trim().optional(),
  logo: z.string().trim().url(),
  customUrl: z.string().trim().optional(),
  email: z.string({
    required_error: "Clinic email is required"
  }).email(),

  isPublic: z.boolean().default(true),
  sendEmailNotification: z.boolean().default(true),
  emailToClinicOnly: z.boolean().default(true),
  enableAppointment: z.boolean().default(true),
  enableConsultation: z.boolean().default(true),
})

export default function ClinicGeneralSettings() {

  const {clinicUid} = useParams<{clinicUid: string}>()

  const {data: clinic, isLoading, mutate} = useClinic(clinicUid)
    
  const form = useForm<ClinicGeneralSettingsForm>({
    resolver: zodResolver(generalSettingsForm),
    values: {
      clinicUid: clinic?.data?.data?.clinicUid ?? "",
      name: clinic?.data?.data?.name ?? "",
      description: clinic?.data?.data?.description ?? "",
      logo: clinic?.data?.data?.logo ?? "",
      customUrl: clinic?.data?.data?.customUrl ?? "",
      email: clinic?.data?.data?.email ?? "",
      isPublic: clinic?.data?.data?.ClinicSetting?.isPublic ?? false,
      sendEmailNotification: clinic?.data?.data?.ClinicSetting?.sendEmailNotification ?? false,
      emailToClinicOnly: clinic?.data?.data?.ClinicSetting?.emailToClinicOnly ?? false,
      enableAppointment: clinic?.data?.data?.ClinicSetting?.enableAppointment ?? false,
      enableConsultation: clinic?.data?.data?.ClinicSetting?.enableConsultation ?? false,
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(promiseWrapper(updateClinicAction)(clinicUid, data), {
        loading: "Saving changes...",
        success: (res) => {
          mutate()
          form.reset(data)
          return res.message;
        },
        error: error => error.message,
        position: "top-center"
      })
    })();
  }
  
  if(isLoading) return <PageLoading label="Page loading, Please wait a moment..."/>
  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>
          General settings for your clinic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={action} className="w-full space-y-6">
            <div className="flex flex-wrap gap-2 items-baseline">
              <FormField
                control={form.control}
                name="clinicUid"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Unique ID</FormLabel>
                    <FormControl>
                      <Input disabled readOnly {...field} />
                    </FormControl>
                    <FormDescription>
                      The unique identifier for your clinic.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                rules={{
                  required: "Clinic name is required"
                }}
                name="name"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The unique identifier for your clinic.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isPublic"
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
                    Make clinic public
                    </FormLabel>
                    <FormDescription>
                    Allow users to find and join your clinic.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormDescription>
                  A brief description of your clinic.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-wrap gap-2 items-baseline">
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Clinic Logo URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The logo for your organization.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormDescription>
                    The email address for your organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <h5 className="text-lg font-semibold">Clinic Preferences</h5>
              <Separator/>
            </div>
            <FormField
              control={form.control}
              name="sendEmailNotification"
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
                    Send email notifications
                    </FormLabel>
                    <FormDescription>
                    Send email notifications to your organization members for important updates, announcements, and more.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailToClinicOnly"
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
                    Send email notifications to clinic only.
                    </FormLabel>
                    <FormDescription>
                    Only send email notifications to clinic official email address.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <div>
              <h5 className="text-lg font-semibold">Feature Flags</h5>
              <Separator/>
            </div>
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
                    Enable or disable the appointment management feature for your clinic.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
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
                      Enable or disable the consultation management feature for your clinic.
                    </FormDescription>
                  </div>
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
      <CardFooter>
        {
          clinic?.data?.data?.updatedAt && 
          (
            <Badge variant="secondary">
              Updated last {dayjs(clinic.data.data.updatedAt).fromNow()}
            </Badge>
          )
        }
      </CardFooter>
    </Card>
  )
}