"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"

import {toast} from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import Each from "@components/utils/Each"
import { setMyDefaultOrganizationAction } from "@actions/organizations/organization.action"
import { useUser } from "@auth0/nextjs-auth0/client"
import ActionButton from "@components/ActionButton"
import { OrgDefaultRoleForm } from "./OrgDefaultRoleForm"
import ConditionalRender from "@components/utils/ConditionalRender"
import { useOrgMembers } from "@/hooks/useOrgMember"
import { useUserDefaultOrg, useUserDefaultOrgsRole } from "@/hooks/useUserDefault"
import { promiseWrapper } from "@/lib/with-error-handling"

const organizationFormSchema = z.object({
  defaultOrgUid: z.string(),
})

type DefaultOrgFormSchema = z.infer<typeof organizationFormSchema>

export default function OrganizationsSettings() {
  const user = useUser();
  const userId = user?.user?.sub ?? undefined;

  const {data: myOrgs} = useOrgMembers({userId, distinct: true}, !!userId) 
  const {data: defaultOrg} = useUserDefaultOrg(userId ?? "", !!userId) 
  const {data: myDefaultOrgsRole} = useUserDefaultOrgsRole(userId ?? "", !!userId)
  
  const form = useForm<DefaultOrgFormSchema>({
    resolver: zodResolver(organizationFormSchema),
    values: {
      defaultOrgUid: defaultOrg?.data?.Organization.orgUid ?? ""
    }
  })

  async function action(){
    form.handleSubmit(async (data)  => {
      toast.promise(promiseWrapper(setMyDefaultOrganizationAction)(defaultOrg?.data?.id ?? 0, data.defaultOrgUid, userId), {
        loading: "Updating default organization...",
        success: (res) => {
          form.reset(data)
          return res.message
        },
        error: error => error
      })
    })()
  } 
  
  return (
    <Form {...form}>
      <form action={action} className="space-y-8">
        <FormField
          control={form.control}
          name="defaultOrgUid"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Default Organization</FormLabel>
                <Select key={field.value} name="defaultOrgUid" onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={myOrgs?.data?.data ?? []}
                      render={({ Organization: {id, orgUid, name} }) => (
                        <SelectItem value={orgUid}>{name}</SelectItem>
                      )}
                    />
                  </SelectContent>
                </Select>
                <FormDescription>
                This will the default organization that will be used when you open your dashboard.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}}
        />
        <ConditionalRender condition={form.formState.isDirty}>
          <ActionButton disabled={form.formState.isLoading} type="submit">Update</ActionButton>
        </ConditionalRender>
      </form>
      <Each
        of={myOrgs?.data?.data ?? []}
        render={(membership) => (
          <OrgDefaultRoleForm 
            key={membership.id}
            defaultRoleId={myDefaultOrgsRole?.data?.find(role => role.organizationId === membership.Organization.id)?.id}
            userId={membership.User.userId}
            organization={{
              orgUid: membership.Organization.orgUid,
              name: membership.Organization.name
            }} 
          />
        )}
      />
    </Form>
  )
}

