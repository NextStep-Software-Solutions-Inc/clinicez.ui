"use client";

import { getOrganizationRolesAction, getUserOrganizationsAction, joinOrganizationAction } from "@actions/organization.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import ActionButton from "@components/ActionButton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";



export const JoinOrgForm = () => {
    
  const user = useUser();
  const {organization} = useParams<{organization: string}>();
  const [myOrgs, setMyOrgs] = useState<Awaited<ReturnType<typeof getUserOrganizationsAction>>>([]);
  const [orgRoles, setOrgRoles] = useState<Awaited<ReturnType<typeof getOrganizationRolesAction>>>([]);
  const existingRoles = myOrgs.map(org => org.role);

  const joinOrgSchema = z.object({
    roleId: z.coerce.number({
      required_error: "Please select your role"
    }).refine((role) => {
      return !existingRoles.includes(role);
    }, (value) => ({
      message: `Role already exists in the organization. Please select another role.`
    }))
  })

  type RolesType = z.infer<typeof joinOrgSchema>;
  
  const form = useForm<RolesType>({
    resolver: zodResolver(joinOrgSchema),
  });

  const action = async () => {
    const userId = user?.user?.sub;
    if (!userId) return;

    form.handleSubmit(async (values) => {
      toast.promise(joinOrganizationAction({
        orgId: organization,
        roleId: values.roleId,
        userId
      }), {
        loading: "Joining organization...",
        success: "You have successfully joined the organization, please wait for the admin to approve your request.",
        error: "Something went wrong while joining the organization. Please try again later."
      })
    }, (error) => {
      toast.error(`Form error: ${error.roleId?.message}`)
    })()
  }

  useEffect(() => {
    (async () => {
      if (!user?.user?.sub) return;
      setMyOrgs(await getUserOrganizationsAction({userId: user.user.sub}));
    })();
  }, [user?.user?.sub]);
  
  useEffect(() => {
    (async () => {
      setOrgRoles(await getOrganizationRolesAction({orgId: organization}));
    })();
  }, [organization]);

  return (
    <Form {...form}>
      <form action={action} className="shadow-xl p-5 rounded-sm">
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => {
            return (
              <FormItem className="space-y-3">
                <FormLabel>Select your role</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                    className="flex flex-row flex-wrap gap-5"
                  >
                    <Each
                      of={orgRoles}
                      render={(role) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={role.id?.toString()}  />
                          </FormControl>
                          <FormLabel className="font-normal capitalize">
                            {role.name}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }}
        />
        <ActionButton className="my-10">Submit</ActionButton>
      </form>
    </Form>
  );
};
