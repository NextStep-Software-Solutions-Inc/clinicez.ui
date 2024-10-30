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
import BackSubmitAndNext from "@components/SubmitAndNext";
import { useAtom } from "jotai";
import { hpApply } from "@state/hp-apply";
import { useHPTypes } from "@hooks/useHPTypes";

interface ISelectHPTypeProps {
  currentHPTypeIds?: number[];
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
} 

export default function SelectHPType({nextStep, prevStep, isFirstStep, isLastStep, currentHPTypeIds}: ISelectHPTypeProps) {
  const {data: hpTypes} = useHPTypes()

  const roleFormSchema = z.object({
    hpTypeId: z.number({
      coerce: true,
      message: "Invalid role",
    }).refine(value => !currentHPTypeIds?.includes(value), (value) => ({
      message: `You have already possessed ${hpTypes?.data.find(type => type.id === value)?.name} role. Please select a different role.`,
    })),
  })
  
  const [applicationData,setApplicationData] = useAtom(hpApply);
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    mode: "all",
    defaultValues: {
      hpTypeId: applicationData?.hpTypeId,
    }
  })

  const action = async () => {
    form.handleSubmit(async (data: z.infer<typeof roleFormSchema>) => {
      setApplicationData(prev => ({...prev, ...data}));
      nextStep?.();
    })()
  }

  return (
    <Form {...form}>
      <form action={action} className="space-y-6 shadow-lg w-full p-8 bg-white rounded-md">
        <FormField
          control={form.control}
          name="hpTypeId"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Healthcare Provider Type</FormLabel>
              <FormControl>
                <RadioGroup
                  name="role"
                  onValueChange={field.onChange}
                  value={field.value?.toString()}
                  className="flex flex-wrap gap-5"
                >
                  <Each
                    of={hpTypes?.data ?? []}
                    render={(type) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={type.id.toString()} onClick={() => form.trigger()}/>
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {type.name}
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
