"use client";

import BackSubmitAndNext from "@components/SubmitAndNext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorage } from "@hooks/useLocalStorage";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { OrganizationApplicationData } from "./OrganizationSteps";
import { GetOrganizationRoles } from "@actions/organization-role.action";

interface SelectOrgFormProps {
  userId: string
  orgId: string
  orgRoles: GetOrganizationRoles
  existingRoles: number[]
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextStep?: () => void;
}


export const SelectOrgForm = ({existingRoles, orgRoles, orgId, userId, nextStep, isFirstStep, isLastStep}:SelectOrgFormProps) => {
  const setOrgApplication = useLocalStorage<OrganizationApplicationData>(`${orgId}_application`, {userId, orgId})[1];
  
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
    mode: "all"
  });

  const handleNext = () => {
    form.handleSubmit(async (values) => {
      await setOrgApplication({
        roleId: values.roleId, 
        roleRequirements: orgRoles.find(role => role.id === values.roleId)?.requirements ?? []
      });
      nextStep?.();
    })();
  }

  return (
    <Form {...form}>
      <form className="shadow-xl p-10 rounded-sm">

        <h2 className="my-5 text-lg font-semibold">Select Organization Role</h2>
        
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
