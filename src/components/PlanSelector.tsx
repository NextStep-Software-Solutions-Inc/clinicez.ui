"use client"

import { useFormState } from "react-dom"
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod"
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
import { toast } from "sonner"
import { submitPlanAction } from "@actions/healthcare-provider";
import { cn } from "@lib/utils";
import SubmitAndNext from "@components/SubmitAndNext";

const FormSchema = z.object({
  plan: z.enum(["basic", "small", "large"], {
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
    plans: string[]
}


export default function PlanSelector({defaultPlan = "", plans = []}: IPlanSelectorProps) {
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
                  className="flex flex-col space-y-1"
                >
                  <Each
                    of={plans}
                    render={(_plan) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={_plan}/>
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {_plan}
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
        <SubmitAndNext/>
      </form>
    </Form>
  );
}
