"use client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, } from "react-hook-form";
import { z } from "zod";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { useLocalStorage } from "@hooks/useLocalStorage";
import { getPlansAction } from "@actions/plan.action";
import { use, useState } from "react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
interface PaymentFormProps {
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

const fetchPlans = getPlansAction()

export default function PaymentForm({ nextStep, prevStep, isFirstStep, isLastStep}: PaymentFormProps) {

  const [paymentVerified, setPaymentVerified] = useState(false);
  const hpPlans = use(fetchPlans)

  const [applicationData,setApplicationData] = useLocalStorage<{
    plan?: string;
    receiptNumber?: string;
  }>("hp-application", {receiptNumber: ""});

  const selectedPlan = hpPlans.find(plan => plan.id === parseInt(applicationData.plan ?? "0"));
  const cost = selectedPlan?.price ?? 0;

  const applicationFormSchema = z.object({
    receiptNumber : z.string().refine(value => value.length > 4 || cost  === 0, {
      message: "Receipt number is required"
    }),
  })

  type formType = z.infer<typeof applicationFormSchema>;

  const form = useForm<formType>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      receiptNumber: applicationData?.receiptNumber,
    }
  })


  const action = async () => {
    form.handleSubmit(async (data: formType) => {
      await setApplicationData(data)
      nextStep?.();
    })();
  }

  const handleVerify = () => {
    setPaymentVerified(true);
    toast.success("Payment verified. You can now proceed to the next step.");
  }

  return (
    <Form {...form}>
      <form 
        action={action} 
        className="prose max-w-full space-y-6 shadow-lg w-full p-8 bg-white rounded-md"
      >
        <h4>Payment</h4>
        <p>This is a one-time payment of <strong>₱{cost}</strong> for the purpose of verifying your identity. This process helps us ensure the security and authenticity of our users.</p>
        <div className="flex items-center gap-2">
          <FormField
            control={form.control}
            name="receiptNumber"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Receipt Number</FormLabel>
                <FormControl>
                  <Input placeholder="OR Number" {...field}/>
                </FormControl>
                <FormDescription>
                This is the receipt number of your payment from an agent.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button onClick={handleVerify} disabled={!form.formState.isValid || paymentVerified} type="button">Verify</Button>
        </div>
        <div className="mt-4">
          <BackSubmitAndNext 
            labels={{
              previous: "Back",
              submit: "Continue",
              next: "Next",
            }}
            disabled={{
              submit:!paymentVerified,
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
