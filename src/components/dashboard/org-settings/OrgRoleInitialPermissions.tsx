"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { useParams } from "next/navigation";
import { toast } from "sonner";
import PageLoading from "@components/PageLoading";
import Each from "@components/utils/Each";
import { usePermissions } from "@hooks/usePermission";
import { useOrgRoleInitialPermissions } from "@hooks/useOrgRoleInitialPermission";
import { setOrgRoleInitialPermissionsAction } from "@actions/role-initial-permission.action";


const FormSchema = z.object({
  permissionIds: z.array(z.number()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
})
  
interface OrgRoleInitialPermissionsProps {
  orgRoleId: number
  currentPermissionIds: number[]
}
export default function OrgRoleInitialPermissions({orgRoleId, currentPermissionIds}:OrgRoleInitialPermissionsProps ) {
  const params = useParams<{organization: string}>()
  const {data: roleInitialPermissions ,isLoading, mutate} = useOrgRoleInitialPermissions({
    orgUid: params.organization,
    orgRoleId
  })
  const {data: permissions ,isLoading: loadingPermissions} = usePermissions()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values: {
      permissionIds: (roleInitialPermissions ?? []).map((item) => item.Permission.id),
    },
  })
  
  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(setOrgRoleInitialPermissionsAction({
        orgRoleId,
        orgUid: params.organization,
        permissionIds: data.permissionIds,
      }), {
        loading: "Saving changes...",
        success: res => {
          if(res.status) {
            mutate()
            form.reset(data)
          }
          return res.message
        },
        error: "Error while saving changes",
      })
    })();
  }
  
  if(isLoading && loadingPermissions) return <p>Loading page, please wait a moment...</p>
  return (
    <Form {...form}>
      <form action={action} className="space-y-8">
        <FormField
          control={form.control}
          name="permissionIds"
          render={() => (
            <FormItem>
              <div className="mb-4 ">
                <FormLabel className="text-base font-medium">Role Initial Permissions</FormLabel>
                <FormDescription>
                  Select the default initial permission set for this role. These permissions will be granted to the role upon role approval.
                </FormDescription>
              </div>
              <Each
                of={permissions ?? []}
                render={(permission) => {
                  return (
                    <FormField
                      key={permission.id}
                      control={form.control}
                      name="permissionIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={permission.id}
                            className="flex flex-row items-start space-x-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permission.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, permission.id])
                                    : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== permission.id
                                      )
                                    )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {permission.description} <span className="italic font-medium">({permission.name})</span>
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  )
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        {
          form.formState.isDirty &&
            <ActionButton type="submit">Save Changes</ActionButton>
        }
      </form>
    </Form>
  )
}