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
import { createUserPlanAction } from "@actions/user-plan.action";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getUserAction } from "@actions/user.action";
import { getPlansAction } from "@actions/plan.action";
import { getReceiptCodeAction } from "@actions/reciept-code.action";

interface TenantPaymentVerificationProps {
    prevStep?: () => void;
    nextStep?: () => void;
    setComplete?: (value: boolean) => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}


const fetchPlans = getPlansAction()
export default function TenantPaymentVerification({ setComplete, prevStep }: TenantPaymentVerificationProps) {
  const [paymentData, setPaymentData] = useLocalStorage("tenant-application", { receiptCode: "" });
  const plans = use(fetchPlans)
  const searchParams = useSearchParams();
  const user = useUser();

  const selectedPlan = plans.find(plan => plan.id === parseInt(searchParams.get("plan") ?? "0"));
  const cost = selectedPlan?.price ?? 0;


  console.log({selectedPlan, paymentData, cost});
  
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
    form.handleSubmit(async (data) => {
      await setPaymentData(data)

      const planId = parseInt(searchParams.get("plan") || "0");
      const dbUser = await getUserAction(user.user?.sub ?? "")
      
      await createUserPlanAction(planId, dbUser.id, "ACTIVE");
      toast.success("Tenant application completed. You can now create your first tenant.");
      await setComplete?.(true);
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
