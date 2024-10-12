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
import {  useMemo } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import ActionButton from "@components/ActionButton"
import { OrgDefaultRoleForm } from "./OrgDefaultRoleForm"
import ConditionalRender from "@components/utils/ConditionalRender"
import { useUserOrganizations } from "@hooks/useUserOrganization"
import { Checkbox } from "@components/ui/checkbox"

const organizationFormSchema = z.object({
  defaultOrgUid: z.string(),
})

type DefaultOrgFormSchema = z.infer<typeof organizationFormSchema>

export default function OrganizationsSettings() {
  const user = useUser();
  const userId = user?.user?.sub
  const {data: myOrgs} = useUserOrganizations({userId, distinct: true}, !!userId,) 
  const defaultOrg = useMemo(() => {
    return myOrgs?.data?.flatMap(org => org.Organization.UserDefaultOrganizations).find(defOrg => defOrg.User.userId === userId)
  }, [myOrgs, userId])
   

  const form = useForm<DefaultOrgFormSchema>({
    resolver: zodResolver(organizationFormSchema),
    values: {
      defaultOrgUid: defaultOrg?.Organization?.orgId ?? ""
    }
  })

  async function action(){
    form.handleSubmit(async (data)  => {
      if(!userId) return;
      toast.promise(setMyDefaultOrganizationAction(defaultOrg?.id ?? 0, data.defaultOrgUid, userId), {
        loading: "Updating default organization...",
        success: () => {
          form.reset(data)
          return "Default organization updated successfully"
        },
        error: "An error occurred while updating default organization."
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
                <Select name="defaultOrgUid" onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={myOrgs?.data ?? []}
                      render={({ Organization: {id, orgId, name} }) => (
                        <SelectItem value={orgId}>{name}</SelectItem>
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
        of={myOrgs?.data ?? []}
        render={(org) => <OrgDefaultRoleForm org={org} key={org.id}/>}
      />
    </Form>
  )
}

