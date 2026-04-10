"use client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { Checkbox } from "@components/ui/checkbox";
import Link from "next/link";
import ConditionalRender from "@components/utils/ConditionalRender";
import { toast } from "sonner";
import { useSound } from "use-sound";
import { joinOrganizationAction, JoinOrganizationPayload } from "@actions/organizations/join-organization.action";
import { revalidatePath } from "@actions/cache.action";
import { useAtom } from "jotai";
import { joinOrgApplicationAtom } from "@state/join-org-application";
import { Button } from "@components/ui/button";
import { promiseWrapper } from "@/lib/with-error-handling";
import { linkRequirementFilesAction } from "@/actions/organizations/org-member-requirement-file.action";

interface ConfirmationAndReviewStepProps {
  orgUid: string
  termsAndConditionsUrl?: string | null;
  privacyPolicyUrl?: string | null;
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

export default function ConfirmationAndReviewStep({ orgUid, termsAndConditionsUrl, privacyPolicyUrl, isComplete, isFirstStep, isLastStep, nextStep, prevStep, startOver, setComplete }:ConfirmationAndReviewStepProps) {
  const [orgApplication, setOrgApplication] = useAtom(joinOrgApplicationAtom);
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
    setOrgApplication({})
    startOver?.();
  }

  const action = async () => {
    form.handleSubmit(async () => {

      const {roleId, userId, orgUid, stagedRequirementFiles} = orgApplication;
      if(!roleId  || !userId  || !orgUid) {
        toast.error("Role or User ID or Org ID is missing!")
        return;
      }
      
      const payload: JoinOrganizationPayload = { userId, orgUid, orgRoleId: roleId }
      
      toast.promise(promiseWrapper(joinOrganizationAction)(payload), {
        loading: "Submitting application...",
        success: async (res) => {
          // Link any staged requirement files to the newly created org member.
          // Filter to only files that match the current role's requirements
          // to avoid linking leftover staged files from a previous role selection.
          const roleRequirements = orgApplication.roleRequirements ?? [];
          const relevantFiles = (stagedRequirementFiles ?? []).filter((f) =>
            roleRequirements.includes(f.requirementType)
          );
          if (res.data?.id && relevantFiles.length > 0) {
            await linkRequirementFilesAction({
              orgMemberId: res.data.id,
              files: relevantFiles,
            });
          }
          setOrgApplication(pres => ({...pres,  complete: true}))
          setComplete?.(true);
          playSuccess()
          return res.message
        },
        error: (error) => {
          playError()
          return error
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
        <form onSubmit={(e) => { e.preventDefault(); action(); }} className="mt-4 flex flex-col gap-2 ">
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
                  I agree to the <Link href={termsAndConditionsUrl ?? "/terms"} target="_blank" className="underline font-medium text-foreground hover:text-primary">Terms and Conditions</Link> of this organization.
                  </FormDescription>
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
                  I agree to the <Link href={privacyPolicyUrl ?? "/privacy"} target="_blank" className="underline font-medium text-foreground hover:text-primary">Privacy Policy</Link> of this organization.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <ConditionalRender condition={agreeAllConditions}>
            <p>
            By clicking submit, you agree to the terms and conditions and privacy policy of {orgUid} organization.
            </p>
          </ConditionalRender>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <BackSubmitAndNext 
              labels={{
                previous: "Back",
                submit: "Submit",
              }}
              disabled={{
                submit:!agreeAllConditions || isComplete,
                previous: isFirstStep || isComplete,
                next: true
              }}
              actions={{
                previous: prevStep,
              }}
            />
            <Button onClick={reset}>Start Over</Button>
          </div>
        </form>
      </div>
    </Form>
  );
};
