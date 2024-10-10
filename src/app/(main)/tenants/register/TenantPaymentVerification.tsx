"use client";

import { z } from "zod";
import BackSubmitAndNext from "../../../../components/SubmitAndNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, } from "react-hook-form";
import { useLocalStorage } from "@hooks/useLocalStorage";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import { Button } from "@components/ui/button";
import { use, useState } from "react";
import { createUserPlanAction } from "@actions/users/user-plan.action";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getPlansAction } from "@actions/plan.action";
import { getReceiptCodeAction } from "@actions/reciept-code.action";
import { useAtom } from "jotai";
import { tenantApplyAtom } from "@state/tenant-apply";

interface TenantPaymentVerificationProps {
    prevStep?: () => void;
    nextStep?: () => void;
    setComplete?: (value: boolean) => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}


const fetchPlans = getPlansAction()
export default function TenantPaymentVerification({ setComplete, prevStep }: TenantPaymentVerificationProps) {
  const [paymentData, setPaymentData] = useAtom(tenantApplyAtom);
  const plans = use(fetchPlans)
  const searchParams = useSearchParams();
  const user = useUser();
  const userId = user.user?.sub;

  const selectedPlan = plans.find(plan => plan.id === parseInt(searchParams.get("plan") ?? "0"));
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
      receiptCode: paymentData?.receiptCode,
    }
  })

  const action = async () =>{
    if(!userId) {
      toast.error("User not found. Please login again.");
      return;
    }
    form.handleSubmit(async (data) => {
      setPaymentData(prev => ({...prev, ...data}));
      const planId = Number(searchParams.get("plan"));
      toast.promise(createUserPlanAction(planId, userId, "ACTIVE"), {
        loading: "Creating tenant application...",
        success: (res) => {
          if(res.status){
            setComplete?.(true);
          }
          return res.message;
        },
        error: "An error occurred while creating tenant application."
      })
    })()
  } 

  const handleVerify = (code: string) => {
    toast.promise(getReceiptCodeAction(code), {
      loading: "Verifying code...",
      success: () => {
        setPaymentVerified(true);
        return "Code verified. You can now submit your application.";
      },
      error: "Invalid Code. Please try again or use different code.",
    })

   
  }

  return (
    <Form {...form}>
      <div className="prose max-w-full mt-5">
        <h3 className="">Payment</h3>
        <p>
        Go to your agent and get a receipt number of your payment. Then, enter the receipt number below.
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
              submit: "Submit",
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
