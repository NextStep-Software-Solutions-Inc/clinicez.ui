"use client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, } from "react-hook-form";
import { z } from "zod";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { useLocalStorage } from "@hooks/useLocalStorage";
import { getPlansAction } from "@actions/plan.action";
import { use } from "react";
import { setUserPlanStatusAction } from "@actions/user-plan.action";
import { toast } from "sonner";
interface PaymentFormProps {
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

const fetchPlans = getPlansAction()

export default function PaymentForm({ nextStep, prevStep, isFirstStep, isLastStep}: PaymentFormProps) {

  const hpPlans = use(fetchPlans)
  const [applicationData,setApplicationData] = useLocalStorage<{
    plan?: string;
    receiptNumber?: string;
  }>("hp-application", {receiptNumber: ""});

  const selectedPlan = hpPlans.find(plan => plan.id === parseInt(applicationData.plan ?? "")) ?? { price: 0};
  const cost = selectedPlan.price;

  const applicationFormSchema = z.object({
    receiptNumber : z.string().refine(value => value.length > 4 || cost  === 0, {
      message: "Receipt number is required"
    }).optional(),
  })

  type formType = z.infer<typeof applicationFormSchema>;
  const form = useForm<formType>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      receiptNumber: applicationData?.receiptNumber,
    }
  })

  const action = async (formData: FormData) => {
    form.handleSubmit(async (data: formType) => {
      await setApplicationData(data)
      await setUserPlanStatusAction(1, "ACTIVE")
      toast.success("User plan activated!")
      nextStep?.();
    })();
  }

  

  return (
    <Form {...form}>
      <form 
        action={action} 
        className="prose max-w-full space-y-6 shadow-lg w-full p-8 bg-white rounded-md"
      >
        <h4>Payment</h4>
        <p>This is a one-time payment of <strong>₱{cost}</strong> for the purpose of verifying your identity. This process helps us ensure the security and authenticity of our users.</p>
        <FormField
          control={form.control}
          name="receiptNumber"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Receipt Number</FormLabel>
              <FormControl>
                <Input placeholder="OR Number" {...field} />
              </FormControl>
              <FormDescription>
                This is the receipt number of your payment from an agent.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="mt-4">
          <BackSubmitAndNext 
            labels={{
              previous: "Back",
              submit: "Continue",
              next: "Next",
            }}
            disabled={{
              submit:!form.formState.isValid,
              previous: isFirstStep,
              next: true,
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
