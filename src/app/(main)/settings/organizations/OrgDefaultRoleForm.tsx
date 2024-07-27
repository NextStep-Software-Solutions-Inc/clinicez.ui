"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import Each from "@components/utils/Each";
import { useEffect, useState } from "react";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { getDefaultOrgRoleAction, setDefaultOrgRoleAction } from "@actions/user-default-organization.action";
import ConditionalRender from "@components/utils/ConditionalRender";
import { getUserOrganizationsAction } from "@actions/user-organization.action";
import { getOrganizationRolesAction } from "@actions/organization-role.action";

interface OrgDefaultRoleFormProps {
  org: Awaited<ReturnType<typeof getUserOrganizationsAction>>[number];
}
const orgDefaultRoleFormSchema = z.object({
  defaultRole: z.coerce.number({
    required_error: "Please select a default role"
  })
});
type OrgDefaultRoleFormSchema = z.infer<typeof orgDefaultRoleFormSchema>;

export const OrgDefaultRoleForm = ({ org }: OrgDefaultRoleFormProps) => {
  const [orgRoles, setOrgRoles] = useState<Awaited<ReturnType<typeof getOrganizationRolesAction>>>([]);
  const [defaultRole, setDefaultRole] = useState<Awaited<ReturnType<typeof getDefaultOrgRoleAction>>>(null);
  const form = useForm<OrgDefaultRoleFormSchema>({
    resolver: zodResolver(orgDefaultRoleFormSchema),
    values: {
      defaultRole: defaultRole?.UserRole.id ?? 0
    }
  });

  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(setDefaultOrgRoleAction({
        id: defaultRole?.id,
        userId: org.User.userId,
        orgId: org.Organization.orgId,
        roleId: data.defaultRole
      }) , {
        loading: "Updating default role...",
        success: () => {
          form.reset(data);
          return "Default role updated successfully";
        },
        error: "Failed to update default role"
      })
    })();
  };

  useEffect(() => {
    (async () => {
      const [orgRoles, defaultRole] = await Promise.all([
        getOrganizationRolesAction({ orgId: org.Organization.orgId, userId: org.User.userId}),
        getDefaultOrgRoleAction(org.User.userId)
      ]);
      await setOrgRoles(() => orgRoles);
      await setDefaultRole(() => defaultRole);
    })();
  }, [org.Organization.orgId, org.User.userId]);

  return (
    <form action={action} className="space-y-8">
      <FormField
        control={form.control}
        name="defaultRole"
        render={({ field }) => (
          <FormItem>
            <FormLabel><span className="font-bold">{org.Organization.name}</span> Default Role</FormLabel>
            <Select onValueChange={field.onChange} value={field.value?.toString()}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <Each
                  of={orgRoles}
                  render={({ id, name }) => (
                    <SelectItem value={id.toString()}>{name}</SelectItem>
                  )} />
              </SelectContent>
            </Select>
            <FormDescription>
              This will the default organization role that will be used when you open your dashboard.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} 
      />
      <ConditionalRender condition={form.formState.isDirty}>
        <ActionButton disabled={!form.formState.isDirty} type="submit">Update</ActionButton>
      </ConditionalRender>
    </form>
  );
};
