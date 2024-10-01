"use client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, } from "react-hook-form";
import { z } from "zod";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { getPlansAction } from "@actions/plan.action";
import { use, useState } from "react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { getReceiptCodeAction } from "@actions/reciept-code.action";
import { useAtom } from "jotai";
import { hpApply } from "@state/hp-apply";
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

  const [applicationData,setApplicationData] = useAtom(hpApply);

  const selectedPlan = hpPlans.find(plan => plan.id === Number(applicationData.planId));
  const cost = selectedPlan?.price ?? 0;

  const applicationFormSchema = z.object({
    receiptCode : z.string().refine(value => value.length > 4 || cost  === 0, {
      message: "Receipt number is required"
    }),
  })

  type formType = z.infer<typeof applicationFormSchema>;

  const form = useForm<formType>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      receiptCode: applicationData?.receiptCode,
    }
  })


  const action = async () => {
    form.handleSubmit(async (data: formType) => {
      setApplicationData(prev => ({...prev, ...data}))
      nextStep?.();
    })();
  }

  const handleVerify = async (code: string) => {
    
    toast.promise(getReceiptCodeAction(code), {
      loading: "Verifying code...",
      success: () => {
        setPaymentVerified(true);
        return "Code verified. You can now proceed to the next step.";
      },
      error: "Invalid code. Please try again.",
    });
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
            name="receiptCode"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Receipt Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Code" onChange={field.onChange} defaultValue={field.value}/>
                </FormControl>
                <FormDescription>
                  This is the receipt code of your payment or a coupon from an agent
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button onClick={() => handleVerify(form.watch("receiptCode"))} disabled={!form.formState.isValid || paymentVerified} type="button">Verify</Button>
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
