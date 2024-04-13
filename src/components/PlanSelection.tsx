"use client"

import { useFormState } from "react-dom"
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod"
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
import { toast } from "sonner"
import { submitPlanAction } from "@actions/healthcare-provider";
import { cn } from "@lib/utils";
import SubmitAndNext from "@components/SubmitAndNext";
import { useContext } from "react";
import { HPApplicationDataContext } from "@contexts/hp-application.context";

const FormSchema = z.object({
  plan: z.enum(["short-term", "long-term", "lifetime"], {
    required_error: "You need to select a plan.",
    invalid_type_error: "Invalid plan",
  }),
})

const formHandler = async (_prevState: any, formData: FormData) => {
  const res = await submitPlanAction(_prevState, formData)
  toast("Your selected plan has been submitted.", {
    action: {
      label: "Close",
      onClick: () => console.log("Undo"),
    },
    description: JSON.stringify(res.message, null, 2),
  })
  return res
}
interface IPlanSelectorProps {
    defaultPlan?: string;
    plans: {
        name: string;
        description: string;
        price: number;
    }[]
}


export default function PlanSelector({defaultPlan = "", plans = []}: IPlanSelectorProps) {
  const {dispatch} = useContext(HPApplicationDataContext);
  const [state, formAction] = useFormState(formHandler, {
    message: "",
    status: false,
  });
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      plan: defaultPlan as z.infer<typeof FormSchema>["plan"],
    }
  })

  const action = async (formData: FormData) => {
    form.handleSubmit((data: z.infer<typeof FormSchema>) => {
      formAction(formData)
      dispatch({selectedPlan: data.plan})
    })()
  }

  return (
    <Form {...form}>
      <FormMessage><p className={cn(state.status? "text-green-500": "")}>{state.message}</p></FormMessage>
      <form 
        action={action} 
        className="w-2/3 space-y-6">
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
        <SubmitAndNext nextIndex="profile" prevIndex="role" labels={{submit: "Save"}}/>
      </form>
    </Form>
  );
}
