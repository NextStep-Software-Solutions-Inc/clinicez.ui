
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import { Textarea } from "@components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";

type GeneralSettingsForm = z.infer<typeof generalSettingsForm>
const generalSettingsForm = z.object({
  orgUid: z.string().readonly(),
  name: z.string(),
  description: z.string().optional(),
  picture: z.string(),
  cover: z.string().optional(),
  customUrl: z.string().optional(),
  email: z.string().email(),

  isPublic: z.boolean().default(true),
  sendEmailNotification: z.boolean().default(true),
  emailToOrgOnly: z.boolean().default(true),
})

export const GeneralSettings = () => {
  const form = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsForm),
    defaultValues: {
      orgUid: "",
      name: ""
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
        <CardTitle>General</CardTitle>
        <CardDescription>
                General settings for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={action} className="w-full space-y-6">
            <div className="flex flex-wrap gap-2 items-center">
              <FormField
                control={form.control}
                name="orgUid"
                disabled
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Unique ID</FormLabel>
                    <FormControl>
                      <Input readOnly {...field} />
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
            <div className="flex flex-wrap gap-2 items-center">
              <FormField
                control={form.control}
                name="picture"
                render={({ field }) => (
                  <FormItem className="grow">
                    <FormLabel>Organization Logo</FormLabel>
                    <FormControl>
                      <Input type="file" {...field} />
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
                    <FormLabel>Organization Cover Photo</FormLabel>
                    <FormControl>
                      <Input type="file" {...field} />
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
            <ActionButton type="submit">Save Changes</ActionButton>
          </form>
        </Form>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}