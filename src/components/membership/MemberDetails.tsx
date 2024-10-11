"use client";

import React from "react";
import { Picture } from "../../app/(main)/user/[user]/phr/Picture";
import { useUser } from "@hooks/useUser";
import { notFound } from "next/navigation";
import { LabelValue } from "@components/LabelValue";
import { differenceInCalendarYears } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { Separator } from "@components/ui/separator";
import { useOrgRoles } from "@hooks/useOrgRole";
import { useOrgAppointments } from "@hooks/useAppointment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import Each from "@components/utils/Each";
import { usePermissions } from "@hooks/usePermission";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import { toast } from "sonner";
import { setUserOrgPermissionsAction } from "@actions/organizations/user-organization-permission.action";
import UnderConstruction from "@components/UnderConstruction";


interface MemberDetailsProps {
    userId: string;
    orgUid: string;
}
export default function MemberDetails({userId, orgUid}:MemberDetailsProps) {
  const {data: user, isLoading} = useUser({ userId, orgUid });
  const {data: roles} = useOrgRoles(orgUid,  {userId});
  const {data: appointments} = useOrgAppointments({orgUid, userId });
  
  if(isLoading) return <div>Loading user...</div>
  if(!user?.data) notFound()
  return (
    <>
      <Card className="bg-slate-100">
        <CardContent className="mt-5">
          <div className="flex flex-wrap gap-5">
            <Picture readOnly user={user?.data}/>
            <div className="space-y-2">
              <div className="flex gap-5 flex-wrap items-center basis-[400px]">
                <LabelValue label="Name" value={`${user.data.firstName} ${user.data.middleName} ${user.data.lastName} ${user.data.suffix ?? ""}`} />
                <Separator orientation="vertical" className="h-6"/>
                <LabelValue label="Age" value={user.data.dob ? differenceInCalendarYears(new Date(), user.data.dob,) : "0"} />
                <Separator orientation="vertical" className="h-6"/>
                <LabelValue label="Gender" value={user?.data.gender} />
              </div>
              <div className="flex gap-5 flex-wrap items-center basis-[400px]">
                <LabelValue label="Roles" value={roles?.length ?? 0} />
                <Separator orientation="vertical" className="h-6"/>
                <LabelValue label="Total Appointments" value={appointments?.data?.length ?? 0} />
              </div>
              <LabelValue label="Joined" value={dayjs(user?.data.createdAt).fromNow()} />
            </div>
          </div>
        </CardContent>
      </Card>
      <TabSection orgUid={orgUid} userId={userId}/>
    </>
  );
}


interface TabSectionProps {
    userId: string;
    orgUid: string;
}
const TabSection = ({orgUid, userId}:TabSectionProps) => {
  return (
    <Tabs defaultValue="roles" className="w-full">
      <TabsList className="flex gap-1 justify-start">
        <TabsTrigger value="roles">Roles</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
        <TabsTrigger value="activities">Activities</TabsTrigger>
      </TabsList>
      <TabsContent value="roles">
        <MemberRoles userId={userId} orgUid={orgUid}/>
      </TabsContent>
      <TabsContent value="permissions">
        <MemberPermissions userId={userId} orgUid={orgUid} />
      </TabsContent>
      <TabsContent value="activities">
        <MemberActivities/>
      </TabsContent>
    </Tabs>
  )
}


interface MemberRolesProps {
    userId: string;
    orgUid: string;
}
export const MemberRoles = ({orgUid,userId}:MemberRolesProps) => {

  const {data: roles} = useOrgRoles(orgUid,  {userId});
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles</CardTitle>
        <CardDescription>
            Roles assigned to this member.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Each
          of={roles ?? []}
          render={(role) => {
            return (
              <div key={role.id} className="flex items-center gap-2">
                <div>{role.name}</div>
                <div className="text-xs text-muted-foreground">{role.description}</div>
              </div>
            )
          }}
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}

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

export const MemberActivities = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
            Activities
        </CardTitle>
        <CardDescription>
            Activities performed by this member in the organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UnderConstruction/>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}