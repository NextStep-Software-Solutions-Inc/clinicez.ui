"use client";

import { setClinicMemberPermissionsAction } from "@/actions/clinics/clinic-member-permission.action";
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
interface ClinicMemberPermissionsProps {
  userId: string;
  clinicUid: string;
}

export const ClinicMemberPermissions = ({clinicUid, userId}: ClinicMemberPermissionsProps) => {
  const {data: myPermissions} = usePermissions({
    userId,
    type: "CLINIC"
  })
  const myPermissionArray = myPermissions?.map((item) => item.name) ?? []
  const updateClinicPermissions = [PERMISSIONS.CLINIC["UPDATE:CLINIC:PERMISSIONS"].name]
  const canUpdateClinicPermissions = updateClinicPermissions.every((item) => myPermissionArray.includes(item))

  const {data: permissions, mutate: mutateClinicMemberPermissions, isLoading: loadingClinicMemberPermissions } = usePermissions({
    userId,
    type: "CLINIC",
  })
  
  const {data: clinicAvailablePermissions, mutate: mutateAvailablePermissions, isLoading: loadingAvailablePermissions} = usePermissions({
    type: "CLINIC",
  })
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values: {
      permissionIds: (permissions ?? []).map((item) => item.id),
    },
  })
  
  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(setClinicMemberPermissionsAction({
        userId,
        clinicUid,
        permissionIds: data.permissionIds,
      }), {
        loading: "Saving changes...",
        success: res => {
          if(res.status) {
            mutateClinicMemberPermissions()
            form.reset(data)
          }
          return res.message
        },
        error: "Error while saving changes",
      })
    })();
  }

  if(loadingClinicMemberPermissions || loadingAvailablePermissions) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Permissions <span className="text-base font-light">(clinic level)</span>
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
                    of={clinicAvailablePermissions ?? []}
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
                                    disabled={!canUpdateClinicPermissions}
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