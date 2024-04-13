"use client";

import SubmitAndNext from "@components/SubmitAndNext";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { submitPaymentAction } from "@actions/healthcare-provider";
import { cn } from "@lib/utils";

const paymentFormSchema = z.object({
  receiptNumber : z.string().nonempty(),
});
  
const handler = async (_prevState: any, formData: FormData) => {
  const res = await submitPaymentAction(_prevState, formData);
  toast("Server says:", {
    action: {
      label: "Close",
      onClick: () => toast.dismiss(),
    },
    description: res.message,
  })
  return res;
}

export default function PaymentForm() {
  const [formState, formAction] = useFormState(handler , {
    message: "",
    status: false
  })
  const cost = 50;
  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
  });

  const action = async (formData: FormData) => {
    form.handleSubmit((values: z.infer<typeof paymentFormSchema>) => {
      formAction(formData)
    })()
  }

  return (
    <Form {...form}>
      <FormMessage><p className={cn(formState.status? "text-green-500": "")}>{formState.message}</p></FormMessage>
      <form action={action} className="space-y-6">
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
        <SubmitAndNext nextIndex="confirmation" prevIndex="profile" labels={{submit: "Save"}}/>
      </form>
    </Form>
  );
}
