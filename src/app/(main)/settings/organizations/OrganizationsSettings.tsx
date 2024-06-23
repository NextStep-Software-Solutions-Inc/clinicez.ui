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
import { getMyDefaultOrganizationAction, getUserOrganizationsAction, setMyDefaultOrganizationAction } from "@actions/organization.action"
import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import ActionButton from "@components/ActionButton"
import { OrgDefaultRoleForm } from "./OrgDefaultRoleForm"

const organizationFormSchema = z.object({
  defaultOrgUid: z.string(),
})

type DefaultOrgFormSchema = z.infer<typeof organizationFormSchema>

export default function OrganizationsSettings() {
  const [myOrgs, setMyOrgs] = useState<Awaited<ReturnType<typeof getUserOrganizationsAction>>>([])
  const [defaultOrg, setDefaultOrg] = useState<Awaited<ReturnType<typeof getMyDefaultOrganizationAction>>>(null)
  const user = useUser();

  useEffect(() => {
    (async () => {
      if(!user.user?.sub) return
      const orgs = (await getUserOrganizationsAction({userId: user.user.sub})).filter(o => ["ACTIVE"].includes(o.status))
      
      const distinctOrgs = orgs.reduce((acc: typeof orgs, current) => {
        const x = acc.find(item => item.Organization.orgId === current.Organization.orgId)
        if(!x) {
          return acc.concat([current])
        } else {
          return acc
        }
      }, [])

      await setMyOrgs(distinctOrgs)
      await setDefaultOrg(await getMyDefaultOrganizationAction(user.user.sub))
    })()
  }, [user?.user?.sub])

  const form = useForm<DefaultOrgFormSchema>({
    resolver: zodResolver(organizationFormSchema),
    values: {
      defaultOrgUid: defaultOrg?.Organization?.orgId ?? "",
    }
  })

  async function action(){
    form.handleSubmit(async (data)  => {
      if(!user.user?.sub) return;
      await setMyDefaultOrganizationAction(defaultOrg?.id ?? 0, data.defaultOrgUid, user.user.sub)
      toast.success("Default organization updated successfully")
      form.reset(data)
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
                      of={myOrgs}
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
        <ActionButton disabled={!form.formState.isDirty} type="submit">Update</ActionButton>
      </form>

      <Each
        of={myOrgs}
        render={(org) => <OrgDefaultRoleForm org={org}/>}
      />
    </Form>
  )
}
