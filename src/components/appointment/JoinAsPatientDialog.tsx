"use client";

import { addClinicPatientAction } from "@/actions/clinics/clinic-patient.action";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useClinicPatients } from "@/hooks/useClinicPatient";
import { promiseWrapper } from "@/lib/with-error-handling";
import { useUser } from "@auth0/nextjs-auth0";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Checkbox } from "../ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import ActionButton from "../ActionButton";

const confirmationFormSchema = z.object({
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

export function JoinAsPatientDialog() {

  const { user } = useUser();
  const searchParams = useSearchParams();
  const { clinicUid } = useParams<{ clinicUid: string }>();
  const open = useMemo(() => searchParams.has("join-as-patient"), [searchParams]);

  const { mutate } = useClinicPatients({
    clinicUid, userId: user?.sub ?? undefined
  })

  const form = useForm<z.infer<typeof confirmationFormSchema>>({
    resolver: zodResolver(confirmationFormSchema),
  })

  const handleClose = (state: boolean) => {
    if (!state) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete("join-as-patient");
      window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
    }
  }

  const action = () => {
    if (!user?.sub) {
      toast.error("User id not found")
      return;
    }
    const searchParams = new URLSearchParams(window.location.search);

    toast.promise(promiseWrapper(addClinicPatientAction)({
      clinicUid,
      userId: user?.sub
    }), {
      loading: "Loading...",
      success: res => {
        searchParams.delete("join-as-patient");
        searchParams.set("book-appointment", "true");
        window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
        handleClose(false);
        mutate()
        return res.message
      },
      error: error => error
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You are about to book appointment.</AlertDialogTitle>
          <AlertDialogDescription>
            Before you continue, please certify that all information is accurate and agree to the terms and conditions and privacy policy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form action={action} className="space-y-2">
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
                      Certify that all my information is accurate
                    </FormLabel>
                    <FormDescription>
                      I hereby certify that all my information provided in this application is true and accurate to the best of my knowledge.
                    </FormDescription>
                    <FormMessage />
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
                      I agree to the <Link href="https://www.healthcare.gov.au/sites/default/files/2021-04/Terms%20and%20Conditions%20for%20Healthcare%20Providers%20and%20Healthcare%20Organisations.pdf" target="_blank">Terms and Conditions</Link> of the Healthcare Organization.
                    </FormDescription>
                    <FormMessage />
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
                      I agree to the <Link href="https://www.healthcare.gov.au/sites/default/files/2021-04/Privacy%20Policy%20for%20Healthcare%20Providers%20and%20Healthcare%20Organisations.pdf" target="_blank">Privacy Policy</Link> of the Healthcare Organization.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <ActionButton disabled={!form.formState.isValid} type="submit">Continue</ActionButton>
            </AlertDialogFooter>
          </form>
        </Form>

      </AlertDialogContent>
    </AlertDialog>
  )
}
