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
import { useLocalStorage } from "@hooks/useLocalStorage";
import { getPlansAction } from "@actions/plan.action";
import { use } from "react";

export const planFormSchema = z.object({
  plan: z.string({
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

const fetchPlans = getPlansAction()
export default function SelectPlan({ nextStep, isFirstStep, isLastStep, prevStep,totalSteps}: ISelectPlanProps) {
  const hpPlans = use(fetchPlans)
  // const [hpPlans, setHpPlans] = useState<Awaited<ReturnType<typeof getPlansAction>>| []>([]);
  
  // useEffect(() => {
  //   (async () => {
  //     const plans = await getPlansAction()
  //     setHpPlans(plans);
  //   })()
  // },[])
  
  const [applicationData,setApplicationData] = useLocalStorage("hp-application", {plan: ""});

  const form = useForm<z.infer<typeof planFormSchema>>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      plan: applicationData.plan,
    }
  })

  const action = async (formData: FormData) => {
    form.handleSubmit(async (data: z.infer<typeof planFormSchema>) => {
      await setApplicationData(data)
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
          name="plan"
          render={({ field,  }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select Plan...</FormLabel>
              <FormControl>
                <RadioGroup
                  name="plan"
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-wrap flex-row"
                >
                  <Each
                    of={hpPlans.filter(plan => plan.type === "HEALTHCARE_PROVIDER")}
                    render={(_plan) => (
                      <FormItem className={`flex-1 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-900 has-[:checked]:ring-teal-200 flex items-center space-x-5 bg-white shadow-lg rounded-lg p-4 `}>
                        <FormControl>
                          <RadioGroupItem value={_plan.planUid} />
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
