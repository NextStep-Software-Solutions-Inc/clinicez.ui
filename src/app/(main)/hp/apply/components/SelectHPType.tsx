"use client"

import Each from "../../../../../components/utils/Each";
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group"
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import BackSubmitAndNext from "../../../../../components/SubmitAndNext";
import { $Enums, HealthcareProviderType } from "@prisma/common/client";
import { useAtom } from "jotai";
import { hpApply } from "@state/hp-apply";

const hpTypes = Object.values($Enums.HealthcareProviderType);
const hpTypesSchema = z.nativeEnum($Enums.HealthcareProviderType);
interface ISelectHPTypeProps {
  activeRole?: typeof hpTypes;
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
} 

export default function SelectHPType({nextStep, prevStep, isFirstStep,isLastStep, activeRole}: ISelectHPTypeProps) {
  const searchParams = useSearchParams();
  const hpType = searchParams.get("HPType") as HealthcareProviderType | undefined;
  const roleFormSchema = z.object({
    hpType: hpTypesSchema.refine(value => hpTypes.includes(value) , {
      message: "Invalid role",
    }).refine(value => !activeRole?.includes(value), (value) => ({
      message: `You have already possessed ${value} role. Please select a different role.`,
    })),
  })
  
  const [applicationData,setApplicationData] = useAtom(hpApply);
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    mode: "all",
    defaultValues: {
      hpType: hpType || applicationData?.hpType,
    }
  })

  const action = async (formData: FormData) => {
    form.handleSubmit(async (data: z.infer<typeof roleFormSchema>) => {
      setApplicationData(prev => ({...prev, ...data}))
      nextStep?.();
    })()
  }

  return (
    <Form {...form}>
      <form action={action} className="space-y-6 shadow-lg w-full p-8 bg-white rounded-md">
        <FormField
          control={form.control}
          name="hpType"
          render={({ field,  }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select HP Type</FormLabel>
              <FormControl>
                <RadioGroup
                  name="role"
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-wrap gap-5"
                >
                  <Each
                    of={hpTypes}
                    render={(type) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={type} onClick={() => form.trigger()}/>
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {type}
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
