"use client";

import { setUserOrgPermissionsAction } from "@actions/organizations/user-organization-permission.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import ActionButton from "@components/ActionButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Checkbox } from "@components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePermissions } from "@hooks/usePermission";
import { PERMISSIONS } from "@lib/permissions";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const FormSchema = z.object({
  permissionIds: z.array(z.number()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
})
  interface MemberPermissionsProps {
      userId: string;
      orgUid: string;
  }
export const MemberPermissions = ({orgUid, userId}: MemberPermissionsProps) => {
  const {user} = useUser()
  const {data: myPermissions} = usePermissions({
    userId: user?.sub ?? undefined,
  })
  const myPermissionArray = myPermissions?.map((item) => item.name) ?? []
  const updateOrgPermissions = [PERMISSIONS.CLINIC["UPDATE:ORG:PERMISSIONS"].name]
  const canUpdateOrgPermissions = updateOrgPermissions.every((item) => myPermissionArray.includes(item))

  const {data: permissions, mutate: mutateMemberPermissions, isLoading: loadingMemberPermissions } = usePermissions({
    userId,
    type: "ORGANIZATION",
  })
  const {data: orgAvailablePermissions, mutate: mutateAvailablePermissions, isLoading: loadingAvailablePermissions} = usePermissions({
    type: "ORGANIZATION",
  })
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values: {
      permissionIds: (permissions ?? []).map((item) => item.id),
    },
  })
  
  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(setUserOrgPermissionsAction({
        userId,
        orgUid,
        permissionIds: data.permissionIds,
      }), {
        loading: "Saving changes...",
        success: res => {
          if(res.status) {
            mutateMemberPermissions()
            form.reset(data)
          }
          return res.message
        },
        error: "Error while saving changes",
      })
    })();
  }

  if(loadingMemberPermissions || loadingAvailablePermissions) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle>
              Permissions
        </CardTitle>
        <CardDescription>
              Manage permissions for this member.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={action} className="space-y-8">
            <FormField
              control={form.control}
              name="permissionIds"
              render={() => (
                <FormItem>
                  <div className="mb-4 ">
                    <FormLabel className="text-base font-medium">Available Permissions</FormLabel>
                    <FormDescription>
                          Select permissions to assign to this member.
                    </FormDescription>
                  </div>
                  <Each
                    of={orgAvailablePermissions ?? []}
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
                                    disabled={!canUpdateOrgPermissions}
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
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}