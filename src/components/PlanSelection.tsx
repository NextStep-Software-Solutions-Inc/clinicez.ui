"use client";

import Each from "@components/utils/Each";
import {useForm } from "react-hook-form"
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
import BackSubmitAndNext from "./SubmitAndNext";
import { useLocalStorage } from "@hooks/useLocalStorage";

const plans = [
  {
    name: "short-term",
    price: 200,
    description: "1 year subscription",
  },
  {
    name: "long-term",
    price: 500,
    description: "3 years subscription",
  },
  {
    name: "lifetime",
    price: 1000,
    description: "Lifetime subscription",
  }
  
]
export const planFormSchema = z.object({
  plan: z.string({
    required_error: "You need to select a plan.",
    invalid_type_error: "Invalid plan",
  }).refine(value => ["short-term", "long-term", "lifetime"].includes(value), {
    message: "Invalid plan",
  }),
})

interface IPlanSelectorProps {
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  totalSteps?: number;
}


export default function PlanSelector({ nextStep, isFirstStep, isLastStep, prevStep,totalSteps}: IPlanSelectorProps) {
  const [applicationData,setApplicationData] = useLocalStorage("hp-application", {plan: "short-term"});
  const form = useForm<z.infer<typeof planFormSchema>>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      plan: applicationData.plan || "short-term",
    }
  })

  const onSubmit = async (data: z.infer<typeof planFormSchema>) => {
    await setApplicationData(data)
    nextStep?.();
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 shadow-lg w-full p-8 bg-white rounded-md">
        <FormField
          control={form.control}
          name="plan"
          render={({ field,  }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select Plan...</FormLabel>
              <FormControl>
                <RadioGroup
                  name="plan"
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-row space-x-5"
                >
                  <Each
                    of={plans}
                    render={(_plan) => (
                      <FormItem className={`w-full has-[:checked]:bg-teal-50 has-[:checked]:text-teal-900 has-[:checked]:ring-teal-200 flex items-center space-x-5 bg-white shadow-lg rounded-lg p-4 `}>
                        <FormControl>
                          <RadioGroupItem value={_plan.name} />
                        </FormControl>
                        <div className="flex flex-col gap-2">
                          <FormLabel className="font-normal capitalize">
                            {_plan.name}
                          </FormLabel>
                          <FormLabel>
                            {_plan.description}
                          </FormLabel>
                        </div>
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
