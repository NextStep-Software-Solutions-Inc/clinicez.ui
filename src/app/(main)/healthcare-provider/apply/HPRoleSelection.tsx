"use client"

import Each from "../../../../components/utils/Each";
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group"
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import BackSubmitAndNext from "../../../../components/SubmitAndNext";
import {useLocalStorage} from "@hooks/useLocalStorage";
const roles = ["doctor", "nurse", "pharmacist", "laboratory", "admin"];

export const roleFormSchema = z.object({
  role: z.string({
    required_error: "You need to select a role.",
    invalid_type_error: "Invalid role",
  }).refine(value => ["doctor", "nurse", "pharmacist", "laboratory", "admin"].includes(value), {
    message: "Invalid role",
  }),
})

interface IHealthcareRoleSelectorProps {
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

export default function HealthcareRoleSelector({nextStep, prevStep, isFirstStep,isLastStep}: IHealthcareRoleSelectorProps) {
  const role = useSearchParams().get("role")?? "";
  const [applicationData,setApplicationData] = useLocalStorage("hp-application", {role});
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      role: role || applicationData?.role || "doctor",
    }
  })

  const onSubmit = async (data: z.infer<typeof roleFormSchema>) => {
    await setApplicationData(data)
    nextStep?.();
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 shadow-lg w-full p-8 bg-white rounded-md">
        <FormField
          control={form.control}
          name="role"
          render={({ field,  }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select Role...</FormLabel>
              <FormControl>
                <RadioGroup
                  name="role"
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-row space-x-5"
                >
                  <Each
                    of={roles}
                    render={(_role) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={_role}/>
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {_role}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </RadioGroup>
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />
        <div className="mt-4">
          <BackSubmitAndNext 
            labels={{
              previous: "Back",
              submit: "Save & Continue",
              next: "Next",
            }}
            disabled={{
              submit:!form.formState.isValid,
              previous: isFirstStep,
              next: !isLastStep,
            }}
            actions={{
              previous: prevStep,
            }}
          />
        </div>
      </form>
    </Form>
  );
}
