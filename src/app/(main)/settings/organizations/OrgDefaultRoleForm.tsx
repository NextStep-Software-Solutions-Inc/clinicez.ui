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
import { useMemo } from "react";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { setDefaultOrgRoleAction } from "@actions/users/user-default-organization.action";
import ConditionalRender from "@components/utils/ConditionalRender";
import { getUserOrganizationsAction } from "@actions/users/user-organization.action";
import { useOrgRoles } from "@hooks/useOrgRole";

interface OrgDefaultRoleFormProps {
  org: Awaited<ReturnType<typeof getUserOrganizationsAction>>["data"][number];
}
const orgDefaultRoleFormSchema = z.object({
  defaultRole: z.coerce.number({
    required_error: "Please select a default role"
  })
});
type OrgDefaultRoleFormSchema = z.infer<typeof orgDefaultRoleFormSchema>;

export const OrgDefaultRoleForm = ({ org }: OrgDefaultRoleFormProps) => {
  
  const {data: orgRoles} = useOrgRoles(org.Organization.orgId, {
    userId: org.User.userId
  });

  const defaultRole = useMemo(() => org.Organization.UserDefaultOrganizationRoles.find(role => role.UserRole.id), [org.Organization.UserDefaultOrganizationRoles]);
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
                  of={orgRoles?? []}
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
