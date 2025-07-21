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
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { setDefaultOrgRoleAction } from "@actions/users/user-default-organization.action";
import ConditionalRender from "@components/utils/ConditionalRender";
import { useOrganizationRoles } from "@/hooks/useOrganizationRole";
import { promiseWrapper } from "@/lib/with-error-handling";
import { GetOrgMembers } from "@/actions/organizations/org-member.action";

interface OrgDefaultRoleFormProps {
  organization: {
    name: string;
    orgUid: string;
  }
  userId: string;
  defaultRoleId?: number;
}
const orgDefaultRoleFormSchema = z.object({
  roleId: z.coerce.number({
    required_error: "Please select a default role"
  })
});
type OrgDefaultRoleFormSchema = z.infer<typeof orgDefaultRoleFormSchema>;

export const OrgDefaultRoleForm = ({ defaultRoleId, organization: { name, orgUid }, userId }: OrgDefaultRoleFormProps) => {

  const { data: orgRoles } = useOrganizationRoles({ orgUid, userId });

  const form = useForm<OrgDefaultRoleFormSchema>({
    resolver: zodResolver(orgDefaultRoleFormSchema),
    values: {
      roleId: defaultRoleId ?? 0
    }
  });

  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(promiseWrapper(setDefaultOrgRoleAction)({
        id: defaultRoleId,
        userId: userId,
        orgUid: orgUid,
        roleId: data.roleId
      }), {
        loading: "Updating default role...",
        success: (res) => {
          form.reset(data);
          return res.message
        },
        error: error => error
      });
    })();
  };

  return (
    <form action={action} className="space-y-8">
      <FormField
        control={form.control}
        name="roleId"
        render={({ field }) => (
          <FormItem>
            <FormLabel><span className="font-bold">{name}</span> Default Role</FormLabel>
            <Select onValueChange={field.onChange} value={field.value?.toString()}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <Each
                  of={orgRoles?.data ?? []}
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
