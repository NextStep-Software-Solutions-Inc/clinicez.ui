"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorage } from "@hooks/useLocalStorage";
import { useForm } from "react-hook-form";
import { z } from "zod";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { Checkbox } from "@components/ui/checkbox";
import Link from "next/link";
import ConditionalRender from "@components/utils/ConditionalRender";
import { OrganizationApplicationData } from "./OrganizationSteps";
import { toast } from "sonner";
import { useSound } from "use-sound";
import { joinOrganizationAction, JoinOrganizationPayload } from "@actions/join-organization.action";

interface ConfirmationAndReviewStepProps {
  orgId: string
  isLastStep?: boolean;
  isComplete?: boolean;
  isFirstStep?: boolean;
  nextStep?: () => void;
  prevStep?: () => void;
  startOver?: () => void;
  setComplete?: (value: boolean) => void;
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

export default function ConfirmationAndReviewStep({ orgId, isComplete, isFirstStep, isLastStep, nextStep, prevStep, startOver, setComplete }:ConfirmationAndReviewStepProps) {
  const [orgApplication, setOrgApplication] = useLocalStorage<OrganizationApplicationData>(`${orgId}_application`);
  const [playSuccess] = useSound("/audio/success-1.mp3", {
    interrupt: true,
  });
  const [playError] = useSound("/audio/error-call-to-attention.mp3", {
    interrupt: true,
  });

  const form = useForm<z.infer<typeof confirmationFormSchema>>({
    resolver: zodResolver(confirmationFormSchema)
  })

  const reset = async () => {
    const i = Object.entries(orgApplication).reduce((acc, [key, value]) => {
      acc[key] = "";
      return acc;
    }, {} as any);
    await setOrgApplication(i)
    startOver?.();
  }

  const action = async () => {
    form.handleSubmit(async () => {

      if(!(orgApplication.roleId  && orgApplication.userId  && orgApplication.orgId)) {
        toast.error("Role or User ID or Org ID is missing!")
        return;
      }
      
      const payload: JoinOrganizationPayload = {
        userId: orgApplication.userId,
        orgId: orgApplication.orgId,
        orgRoleId: orgApplication.roleId,
      }
      
      toast.promise(joinOrganizationAction(payload), {
        loading: "Submitting application...",
        success: async (res) => {
          if(!res.status) {
            playError()
            return res.message
          }
          await setOrgApplication({ complete: true})
          setComplete?.(true);
          playSuccess()
          localStorage.removeItem(`${orgId}_application`)
          return res.message
        },
        error: (error) => {
          playError()
          return `An error occurred while submitting your application. Error: ${error}`
        },
      });
    })()
  }

  const agreeAllConditions = form.watch(["certify", "agreeTerms", "agreePrivacy"])?.every(Boolean);

  return (
    <Form {...form}>
      <div className="shadow-lg w-full p-8 bg-white rounded-md">
        <h2 className="text-lg font-semibold">Confirmation</h2>
        <p className="mt-2">
          Please review the information you have entered and certify that it is accurate
        </p>
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
          <ConditionalRender condition={agreeAllConditions}>
            <p>
            By clicking submit, you agree to the terms and conditions and privacy policy of {orgId} organization.
            </p>
          </ConditionalRender>
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
};
