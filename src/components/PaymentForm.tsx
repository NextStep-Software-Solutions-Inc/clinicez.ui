"use client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, } from "react-hook-form";
import { z } from "zod";
import BackSubmitAndNext from "./SubmitAndNext";
import { useLocalStorage } from "@hooks/useLocalStorage";
interface PaymentFormProps {
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}
export const applicationFormSchema = z.object({
  receiptNumber : z.string().min(1, {
    message: "Receipt number is required",
  }),
})

export default function PaymentForm({ nextStep, prevStep, isFirstStep, isLastStep}: PaymentFormProps) {
  const [applicationData,setApplicationData] = useLocalStorage("hp-application", {receiptNumber: ""});
  const form = useForm<z.infer<typeof applicationFormSchema>>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      receiptNumber: applicationData?.receiptNumber,
    }
  })

  const onSubmit = async (data: z.infer<typeof applicationFormSchema>) => {
    await setApplicationData(data)
    nextStep?.();
  }
  
  const cost = 50;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="prose max-w-full space-y-6 shadow-lg w-full p-8 bg-white rounded-md">
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
