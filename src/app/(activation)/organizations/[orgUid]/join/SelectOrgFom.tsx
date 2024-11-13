"use client";

import BackSubmitAndNext from "@components/SubmitAndNext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { GetOrganizationRoles } from "@actions/organizations/organization-role.action";
import { useAtom } from "jotai";
import { joinOrgApplicationAtom } from "@state/join-org-application";

interface SelectOrgFormProps {
  userId: string
  orgUid: string
  orgRoles: GetOrganizationRoles
  existingRoles: number[]
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextStep?: () => void;
}


export const SelectOrgForm = ({existingRoles, orgRoles, orgUid, userId, nextStep, isFirstStep, isLastStep}:SelectOrgFormProps) => {
  const [orgApplication, setOrgApplication] = useAtom(joinOrgApplicationAtom);
  
  const selectRoleSchema = z.object({
    roleId: z.coerce.number({
      required_error: "Please select your role"
    }).refine((role) => !existingRoles.includes(role), (value) => ({
      message: `You already have applied for the role ${orgRoles.find(r => r.id === value)?.name} in this organization. Please select another role.`,
    }))
  })

  type SelectRoleType = z.infer<typeof selectRoleSchema>;
  
  const form = useForm<SelectRoleType>({
    resolver: zodResolver(selectRoleSchema),
    mode: "all",
    defaultValues: {
      roleId: orgApplication.roleId
    }
  });

  const handleNext = () => {
    form.handleSubmit(async (values) => {
      setOrgApplication(prev => ({
        ...prev,
        orgUid,
        userId,
        roleId: values.roleId, 
        roleRequirements: orgRoles.find(role => role.id === values.roleId)?.requirements ?? []
      }));
      nextStep?.();
    })();
  }

  return (
    <Form {...form}>
      <form className="shadow-xl p-10 rounded-sm">
        <h2 className="my-5 text-lg font-semibold">Select your desired role</h2>
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => {
            return (
              <FormItem className="space-y-3">
                <FormLabel>Roles</FormLabel>
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
        <div className="mt-10">
          <BackSubmitAndNext 
            actions={{
              next:handleNext,
            }}
            disabled={{
              next: !form.formState.isValid,
              previous: isFirstStep,
              submit: !isLastStep
            }}/>
        </div>
      </form>
    </Form>
  );
};
