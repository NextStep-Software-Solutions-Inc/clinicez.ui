"use client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { verifyReceiptCodeAction } from "@/actions/receipt-code.action";
import { useAtom } from "jotai";
import { hpApplyAtom } from "@state/hp-apply";
import { usePlans } from "@hooks/usePlan";
interface PaymentFormProps {
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}


export default function PaymentForm({ nextStep, prevStep, isFirstStep, isLastStep }: PaymentFormProps) {
  const [paymentVerified, setPaymentVerified] = useState(false);
  const { data: hpPlans } = usePlans("HEALTHCARE_PROVIDER", "MONTHLY")

  const [hpApplication, setHpApplication] = useAtom(hpApplyAtom);

  const selectedPlan = useMemo(() => hpPlans?.data?.find(plan => plan.id === hpApplication?.planId), [hpPlans, hpApplication]);
  const cost = selectedPlan?.price ?? 0;

  const applicationFormSchema = z.object({
    receiptCode: z.string().refine(value => value.length > 4 || cost === 0, {
      message: "Receipt number is required"
    }),
  })

  type formType = z.infer<typeof applicationFormSchema>;

  const form = useForm<formType>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      receiptCode: hpApplication?.receiptCode,
    }
  })
  const receiptCode = useWatch({
    control: form.control,
    name: "receiptCode",
  });


  const action = async () => {
    form.handleSubmit(async (data: formType) => {
      setHpApplication(prev => ({ ...prev, ...data }))
      nextStep?.();
    })();
  }

  const handleVerify = async (code: string) => {

    toast.promise(verifyReceiptCodeAction(code), {
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
                  <Input placeholder="Enter Code" {...field} />
                </FormControl>
                <FormDescription>
                  This is the receipt code of your payment or a coupon from an agent
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button onClick={() => handleVerify(receiptCode)} disabled={!form.formState.isValid || paymentVerified} type="button">Verify</Button>
        </div>
        <div className="mt-4">
          <BackSubmitAndNext
            labels={{
              previous: "Back",
              submit: "Continue",
              next: "Next",
            }}
            disabled={{
              submit: !paymentVerified,
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
