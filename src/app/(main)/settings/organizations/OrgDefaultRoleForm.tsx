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
import { getOrganizationRolesAction, getUserOrganizationsAction } from "@actions/organization.action";
import { useEffect, useState } from "react";
import ActionButton from "@components/ActionButton";

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
  const form = useForm<OrgDefaultRoleFormSchema>({
    resolver: zodResolver(orgDefaultRoleFormSchema),
  });

  const action = async () => {
    form.handleSubmit(async (data) => {
      console.log(data);
    })();
  };

  useEffect(() => {
    (async () => {
      setOrgRoles(await getOrganizationRolesAction(org.Organization.orgId));
    })();
  }, [org.Organization.orgId]);

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
                  <SelectValue placeholder="Select an organization" />
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
              This will the default organization that will be used when you open your dashboard.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      <ActionButton disabled={!form.formState.isDirty} type="submit">Update</ActionButton>
    </form>
  );
};
