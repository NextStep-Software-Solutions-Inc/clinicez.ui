
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
import { useOrganization } from "@hooks/useOrg";
import { useParams } from "next/navigation";
import { updateOrganizationAction } from "@actions/organizations/organization.action";
import { toast } from "sonner";
import PageLoading from "@components/PageLoading";
import { Badge } from "@components/ui/badge";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

type GeneralSettingsForm = z.infer<typeof generalSettingsForm>
const generalSettingsForm = z.object({
  orgUid: z.string({
    required_error: "Organization unique ID is required"
  }).trim().readonly(),
  name: z.string({
    required_error: "Organization name is required"
  }).trim().readonly(),
  description: z.string().trim().optional(),
  picture: z.string().trim().url(),
  cover: z.string().trim().url().optional(),
  customUrl: z.string().trim().optional(),
  email: z.string({
    required_error: "Organization email is required"
  }).email(),

  isPublic: z.boolean().default(true),
  sendEmailNotification: z.boolean().default(true),
  emailToOrgOnly: z.boolean().default(true),
  enableAppointment: z.boolean().default(true),
  enableConsultation: z.boolean().default(true),
})

export default function GeneralSettings() {
  const params = useParams<{organization: string}>()
  const {data: organization, isLoading, mutate} = useOrganization(params.organization)
  const form = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsForm),
    values: {
      orgUid: organization?.orgId ?? "",
      name: organization?.name ?? "",
      description: organization?.description ?? "",
      picture: organization?.picture ?? "",
      cover: organization?.cover ?? "",
      customUrl: organization?.customUrl ?? "",
      email: organization?.email ?? "",
      isPublic: organization?.OrganizationSetting?.isPublic ?? false,
      sendEmailNotification: organization?.OrganizationSetting?.sendEmailNotification ?? false,
      emailToOrgOnly: organization?.OrganizationSetting?.emailToOrgOnly ?? false,
      enableAppointment: organization?.OrganizationSetting?.enableAppointment ?? false,
      enableConsultation: organization?.OrganizationSetting?.enableConsultation ?? false,
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(updateOrganizationAction(params.organization, data), {
        loading: "Saving changes...",
        success: (res) => {
          if(res.status){
            mutate()
            form.reset(data)
          }
          return res.message;
        },
        error: "An error occurred while saving changes",
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
          General settings for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={action} className="w-full space-y-6">
            <div className="flex flex-wrap gap-2 items-baseline">
              <FormField
                control={form.control}
                name="orgUid"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Unique ID</FormLabel>
                    <FormControl>
                      <Input disabled readOnly {...field} />
                    </FormControl>
                    <FormDescription>
                      The unique identifier for your organization.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                rules={{
                  required: "Organization name is required"
                }}
                name="name"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The unique identifier for your organization.
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
                    Make organization public
                    </FormLabel>
                    <FormDescription>
                    Allow users to find and join your organization.
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
                  <FormLabel>Organization Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormDescription>
                A brief description of your organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-wrap gap-2 items-baseline">
              <FormField
                control={form.control}
                name="picture"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Organization Logo URL</FormLabel>
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
              <FormField
                control={form.control}
                name="cover"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Organization Cover Photo URL</FormLabel>
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
                  <FormLabel>Organization Email</FormLabel>
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
              <h5 className="text-lg font-semibold">Organization Preferences</h5>
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
              name="emailToOrgOnly"
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
                    Send email notifications to organization only.
                    </FormLabel>
                    <FormDescription>
                    Only send email notifications to organization official email address.
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
                    Enable or disable the appointment management feature for your organization.
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
                      Enable or disable the consultation management feature for your organization.
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
          organization?.updatedAt && 
          (
            <Badge variant="secondary">
              Updated last {dayjs(organization.updatedAt).fromNow()}
            </Badge>
          )
        }
      </CardFooter>
    </Card>
  )
}