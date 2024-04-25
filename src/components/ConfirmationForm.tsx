"use client";

import {useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Checkbox } from "./ui/checkbox";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import BackSubmitAndNext from "./SubmitAndNext";
import { useLocalStorage } from "@hooks/useLocalStorage";

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

export default function ConfirmationForm({ nextStep, prevStep, isFirstStep, isComplete, setComplete, startOver }: ConfirmationFormProps) {
  const [applicationData, setApplicationData] = useLocalStorage("hp-application");
  
  const form = useForm<z.infer<typeof confirmationFormSchema>>({
    resolver: zodResolver(confirmationFormSchema)
    
  })

  const action = (formData: FormData) => {
    form.handleSubmit(async (data: z.infer<typeof confirmationFormSchema>) => {
      await setApplicationData({...data, complete: true})
      setComplete?.();
    })()
  }

  const reset = async () => {
    await setApplicationData(Object.keys(applicationData as any).reduce((acc: {[key: string]: string}, key) => {
      acc[key] = "";
      return acc;
    }, {}))
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
                submit: "Finish",
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