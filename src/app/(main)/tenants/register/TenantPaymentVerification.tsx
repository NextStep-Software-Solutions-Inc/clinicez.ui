"use client";

import { z } from "zod";
import BackSubmitAndNext from "../../../../components/SubmitAndNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import { Button } from "@components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { verifyReceiptCodeAction } from "@actions/reciept-code.action";
import { useAtom } from "jotai";
import { tenantApplyAtom } from "@state/tenant-apply";
import { usePlans } from "@hooks/usePlan";

interface TenantPaymentVerificationProps {
    prevStep?: () => void;
    nextStep?: () => void;
    setComplete?: (value: boolean) => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}


export default function TenantPaymentVerification({ prevStep, nextStep }: TenantPaymentVerificationProps) {
  const [tenantApplication, setTenantApplication] = useAtom(tenantApplyAtom);
  const {data: tenantPlans} = usePlans("TENANT");

  const selectedPlan = (tenantPlans?.data ?? []).find(plan => plan.id === tenantApplication.planId);
  const cost = selectedPlan?.price ?? 0;

  const paymentConfirmationFormSchema = z.object({
    receiptCode: z.string().refine((value) => value.length >=5 || cost === 0, {
      message: "Receipt number must be at least 5 characters long."
    })
  })

  const [paymentVerified, setPaymentVerified] = useState(false);
  const form = useForm<z.infer<typeof paymentConfirmationFormSchema>>({
    resolver: zodResolver(paymentConfirmationFormSchema),
    defaultValues: {
      receiptCode: tenantApplication?.receiptCode || "",
    }
  })

  const action = async () =>{
    form.handleSubmit(async (data) => {
      setTenantApplication(prev => ({...prev, ...data}));
      console.log(tenantApplication.receiptCode);
      nextStep?.();
    })()
  } 

  const handleVerify = (code: string) => {
    toast.promise(verifyReceiptCodeAction(code), {
      loading: "Verifying code...",
      success: (res) => {
        if(res.success) {
          setPaymentVerified(true);
        }
        return res.message
      },
      error: "Invalid Code. Please try again or use different code.",
    })
  }

  return (
    <Form {...form}>
      <div className="prose max-w-full mt-5">
        <h3 className="">Payment</h3>
        <p>
        You can find the receipt number from the payment you made to our agent/representative. You may also receive an email from us with the receipt number.
        </p>
      </div>
      <form action={action} className="space-y-6 shadow-lg w-full p-8 bg-white rounded-md">
        <div className="flex items-center gap-2">
          <FormField
            control={form.control}
            name="receiptCode"
            render={({ field }) => (
              <FormItem className="space-y-3 flex-1">
                <FormLabel>Reference Number</FormLabel>
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
          <Button disabled={!form.formState.isValid || paymentVerified} onClick={() => handleVerify(form.watch("receiptCode"))} type="button">Verify</Button>
        </div>
        <div className="mt-4">
          <BackSubmitAndNext
            labels={{
              previous: "Back",
              submit: "Next",
            }}
            disabled={{
              submit: !paymentVerified,
              next: true,
            }}
            actions={{
              previous: prevStep,
            }}
          />
        </div>
      </form>
    </Form>
  )
}
