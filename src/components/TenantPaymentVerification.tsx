"use client";
import { z } from "zod";
import BackSubmitAndNext from "./SubmitAndNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, } from "react-hook-form";
import { useLocalStorage } from "@hooks/useLocalStorage";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "./ui/form";
import { Input } from "./ui/input";

interface TenantPaymentVerificationProps {
    prevStep?: () => void;
    nextStep?: () => void;
    setComplete?: (value: boolean) => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}
export const paymentconfirmationFormSchema = z.object({
  receiptNumber: z.string().min(1, {
    message: "Receipt number is required",
  }),
})
export default function TenantPaymentVerification({ setComplete, prevStep }: TenantPaymentVerificationProps) {
  const [paymentData, setPaymentData] = useLocalStorage("tenant-application", { receiptNumber: "" });
  const form = useForm<z.infer<typeof paymentconfirmationFormSchema>>({
    resolver: zodResolver(paymentconfirmationFormSchema),
    defaultValues: {
      receiptNumber: paymentData?.receiptNumber,
    }
  })

  const onSubmit = async (data: z.infer<typeof paymentconfirmationFormSchema>) => {
    await setPaymentData(data)
    await setComplete?.(true);
  }

  return (
    <Form {...form}>
      <div className="prose h-full rounded-lg text-xl font-bold bg-white p-5">Payment
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="receiptNumber"
            render={({ field }) => (
              <FormItem className="space-y-3">
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
          <div className="mt-4">
            <BackSubmitAndNext
              labels={{
                previous: "Back",
                submit: "Finish",
              }}
              disabled={{
                submit: !form.formState.isValid,
                next: true,
              }}
              actions={{
                previous: prevStep,
              }}
            />
          </div>
        </form>
      </div>
    </Form>
  )
       
}
