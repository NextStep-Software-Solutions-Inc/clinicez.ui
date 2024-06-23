"use client";

import {useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Checkbox } from "../../../../../components/ui/checkbox";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import BackSubmitAndNext from "../../../../../components/SubmitAndNext";
import { useLocalStorage } from "@hooks/useLocalStorage";
import { useUser } from "@auth0/nextjs-auth0/client";
import { toast } from "sonner";
import { HealthcareProviderType } from "@prisma/client";
import { getUserAction } from "@actions/user.action";
import { hpApplicationTransactionAction } from "@actions/user-plan.action";

interface ConfirmationFormProps {
  nextStep?: () => void;
  prevStep?: () => void;
  setComplete?: (value?: boolean) => void;
  startOver?: () => void;
  isComplete?: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}
export const confirmationFormSchema = z.object({
  certify: z.literal(true, {
    required_error: "You need to certify that you are entered the correct information.",
  }),
  agreeTerms: z.literal(true, {
    required_error: "You need to agree to the terms and conditions.",
  }),
  agreePrivacy: z.literal(true, {
    required_error: "You need to agree to the privacy policy.",
  })
})

type formType = z.infer<typeof confirmationFormSchema>

export default function ConfirmationForm({ nextStep, prevStep, isFirstStep, isComplete, setComplete, startOver }: ConfirmationFormProps) {
  const [applicationData, setApplicationData] = useLocalStorage<formType & {
    role: HealthcareProviderType;
    plan: string;
    receiptCode: string;
    complete: boolean;
  }>("hp-application");

  const {user} = useUser();
  
  const form = useForm<formType>({
    resolver: zodResolver(confirmationFormSchema)
  })

  const action = () => {
    form.handleSubmit(async (data) => {

      await setApplicationData({...data, complete: true, role: applicationData?.role, plan: applicationData?.plan, receiptCode: applicationData?.receiptCode})

      const dbUser = await getUserAction(user?.sub ?? "")
      const userId = dbUser.id  
      const planId = parseInt(applicationData.plan)
  
      if(!userId || !planId) return toast.error("An error occurred. Please try again later.");
      
      // transaction method
      toast.promise(hpApplicationTransactionAction({
        planPayload: {planId, userId, status : "ACTIVE"},
        hpPayload: {
          type: applicationData.role,
          User: {
            connect: {
              userId: user?.sub ?? ""
            }
          }
        }, code: applicationData.receiptCode
      }), {
        loading: "Submitting application...",
        success: () => {
          setComplete?.(true);
          return "Healthcare Provider registration successful!";
        },
        error: "An error occurred while submitting your application. Please try again later.",
      });
    })()
  }

  const reset = async () => {
    const i = Object.entries(applicationData).reduce((acc, [key, value]) => {
      acc[key] = "";
      return acc;
    }, {} as any);
    await setApplicationData(i)
    startOver?.();
  }

  return (
    <Form {...form}>
      <div className="prose max-w-full shadow-lg w-full p-8 bg-white rounded-md">
        <h2 className="">Confirmation</h2>
        <p className="mt-2">Your application is ready for submission. Please carefully review all the details you have provided.</p>
        <form action={action} className="mt-4 flex flex-col gap-2 ">
          <FormField
            control={form.control}
            name="certify"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                  Certify that all information is accurate
                  </FormLabel>
                  <FormDescription>
                  I hereby certify that all information provided in this application is true and accurate to the best of my knowledge.
                  </FormDescription>
                  <FormMessage/>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="agreeTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                  Terms and Conditions
                  </FormLabel>
                  <FormDescription>
                 I agree to the <Link href="https://www.healthcare.gov.au/sites/default/files/2021-04/Terms%20and%20Conditions%20for%20Healthcare%20Providers%20and%20Healthcare%20Organisations.pdf" target="_blank">Terms and Conditions</Link> for Healthcare Providers and Healthcare Organizations.
                  </FormDescription>
                  <FormMessage/>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreePrivacy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                  Privacy Policy
                  </FormLabel>
                  <FormDescription>
                  I agree to the <Link href="https://www.healthcare.gov.au/sites/default/files/2021-04/Privacy%20Policy%20for%20Healthcare%20Providers%20and%20Healthcare%20Organisations.pdf" target="_blank">Privacy Policy</Link> for Healthcare Providers and Healthcare Organisations.
                  </FormDescription>
                  <FormMessage/>
                </div>
              </FormItem>
            )}
          />
          <div className="mt-4">
            <BackSubmitAndNext 
              labels={{
                previous: "Back",
                submit: "Submit",
                next: "Start Over",
              }}
              disabled={{
                submit:!form.formState.isValid || isComplete,
                previous: isFirstStep || isComplete,
              }}
              actions={{
                previous: prevStep,
                next: reset,
              }}
            />
          </div>
        </form>
      </div>
    </Form>
  );
}