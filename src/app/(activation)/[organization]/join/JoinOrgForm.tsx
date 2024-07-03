"use client";

import { joinOrganizationAction } from "@actions/organization.action";
import ActionButton from "@components/ActionButton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface JoinOrgFormProps {
  orgId: string
  userId: string
  orgRoles: {
    id: number;
    orgId: number;
    name: string;
    description: string | null;
    isActive: boolean;
  }[]
  existingRoles: number[]
}

export const JoinOrgForm = ({existingRoles, orgRoles, userId, orgId}:JoinOrgFormProps) => {

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
    
    form.handleSubmit(async (values) => {
      toast.promise(joinOrganizationAction({
        orgId,
        userId,
        roleId: values.roleId
      }), {
        loading: "Joining organization...",
        success: "You have successfully joined the organization, please wait for the admin to approve your request.",
        error: "Something went wrong while joining the organization. Please try again later."
      })
    }, (error) => {
      toast.error(`Form error: ${error.roleId?.message}`)
    })()
  }

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
