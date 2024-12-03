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
import BackSubmitAndNext from "../../../../../components/SubmitAndNext";
import { getPlansAction } from "@actions/plan.action";
import { useAtom } from "jotai";
import { hpApplyAtom } from "@state/hp-apply";
import { usePlans } from "@hooks/usePlan";

export const planFormSchema = z.object({
  planId: z.number({
    coerce: true,
    required_error: "You need to select a plan.",
    invalid_type_error: "Invalid plan",
  }).min(1, {
    message: "You need to select a plan.",
  }),
})

interface ISelectPlanProps {
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  totalSteps?: number;
}

export default function SelectPlan({ nextStep, isFirstStep, isLastStep, prevStep,totalSteps}: ISelectPlanProps) {
  const {data: hpPlans} = usePlans("HEALTHCARE_PROVIDER", "MONTHLY")
  const [applicationData,setApplicationData] = useAtom(hpApplyAtom);
  
  const form = useForm<z.infer<typeof planFormSchema>>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      planId: applicationData.planId,
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      setApplicationData(prev => ({...prev, ...data}))
      nextStep?.();
    })()
  }

  return (
    <Form {...form}>
      <form 
        action={action}
        className="space-y-6 shadow-lg w-full p-8 bg-white rounded-md">
        <FormField
          control={form.control}
          name="planId"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Plan</FormLabel>
              <FormControl>
                <RadioGroup
                  name="plan"
                  onValueChange={(value) => field.onChange({
                    target: {
                      name: field.name,
                      value: parseInt(value),
                    }
                  })}
                  value={field?.value?.toString()}
                  className="flex flex-wrap flex-row"
                >
                  <Each
                    of={(hpPlans?.data ?? []).filter(plan => plan.type === "HEALTHCARE_PROVIDER")}
                    render={(_plan) => (
                      <FormItem className={`flex-1 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-900 has-[:checked]:ring-teal-200 flex items-center space-x-5 bg-white shadow-lg rounded-lg p-4 `}>
                        <FormControl>
                          <RadioGroupItem value={_plan.id.toString()} />
                        </FormControl>
                        <div className="flex items-center gap-5">
                          <span className="font-bold text-2xl">₱{_plan.price}</span>
                          <div  className="flex flex-col gap-2">
                            <FormLabel className="font-normal capitalize">
                              {_plan.name}
                            </FormLabel>
                            <FormLabel>
                              {_plan.description}
                            </FormLabel>
                          </div>
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
              submit: !form.formState.isValid,
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
