'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { selfEnrollAsClinicPatientAction } from '@/actions/clinics/clinic-patient.action';
import { promiseWrapper } from '@/lib/with-error-handling';

const DEFAULT_TERMS_URL =
  'https://www.healthcare.gov.au/sites/default/files/2021-04/Terms%20and%20Conditions%20for%20Healthcare%20Providers%20and%20Healthcare%20Organisations.pdf';
const DEFAULT_PRIVACY_URL =
  'https://www.healthcare.gov.au/sites/default/files/2021-04/Privacy%20Policy%20for%20Healthcare%20Providers%20and%20Healthcare%20Organisations.pdf';

const consentSchema = z.object({
  certify: z.literal(true, {
    required_error: 'You need to certify that your information is accurate.',
  }),
  agreeTerms: z.literal(true, {
    required_error: 'You need to agree to the terms and conditions.',
  }),
  agreePrivacy: z.literal(true, {
    required_error: 'You need to agree to the privacy policy.',
  }),
});

type ConsentFormValues = z.infer<typeof consentSchema>;

interface JoinAsPatientDialogV2Props {
  /** Clinic to enroll into */
  clinicUid: string;
  /** Clinic display name shown in the dialog */
  clinicName: string;
  /** Optional custom terms & conditions URL */
  termsUrl?: string | null;
  /** Optional custom privacy policy URL */
  privacyUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called after successful enrollment so the parent can proceed to booking */
  onSuccess: () => void;
}

export function JoinAsPatientDialogV2({
  clinicUid,
  clinicName,
  termsUrl,
  privacyUrl,
  isOpen,
  onClose,
  onSuccess,
}: JoinAsPatientDialogV2Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ConsentFormValues>({
    resolver: zodResolver(consentSchema),
    mode: 'onChange',
    defaultValues: {
      certify: undefined,
      agreeTerms: undefined,
      agreePrivacy: undefined,
    },
  });

  const resolvedTermsUrl = termsUrl?.trim() || DEFAULT_TERMS_URL;
  const resolvedPrivacyUrl = privacyUrl?.trim() || DEFAULT_PRIVACY_URL;

  const handleSubmit = form.handleSubmit(async () => {
    setIsSubmitting(true);
    toast.promise(promiseWrapper(selfEnrollAsClinicPatientAction)({ clinicUid }), {
      loading: 'Enrolling you as a patient…',
      success: (res) => {
        setIsSubmitting(false);
        form.reset();
        onClose();
        onSuccess();
        return res.message;
      },
      error: (err: string) => {
        setIsSubmitting(false);
        return err;
      },
    });
  });

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Book an appointment at {clinicName}</AlertDialogTitle>
          <AlertDialogDescription>
            To schedule an appointment at this clinic, your profile will be registered as a
            patient. Please review and accept the terms below to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-2">
            <FormField
              control={form.control}
              name="certify"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Certify that all my information is accurate</FormLabel>
                    <FormDescription>
                      I hereby certify that all my information provided is true and accurate to the
                      best of my knowledge.
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
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Terms and Conditions</FormLabel>
                    <FormDescription>
                      I agree to the{' '}
                      <Link
                        href={resolvedTermsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Terms and Conditions
                      </Link>{' '}
                      of the Healthcare Organization.
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
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Privacy Policy</FormLabel>
                    <FormDescription>
                      I agree to the{' '}
                      <Link
                        href={resolvedPrivacyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Privacy Policy
                      </Link>{' '}
                      of the Healthcare Organization.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <Button disabled={!form.formState.isValid || isSubmitting} type="submit">
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling…
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
