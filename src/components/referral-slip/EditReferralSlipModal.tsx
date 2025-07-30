import { useCallback, useEffect, useState } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Textarea } from "@components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { SearchableDropdown } from "@components/ui/searchable-dropdown";
import { updateReferralSlipAction } from "@actions/clinics/clinical-record/referral-slip.action";
import { useReferralReasons } from "@hooks/useReferralReasons";
import { useHPs } from "@/hooks/useHP";
import { UnsavedChangesAlert } from "@/components/UnsavedChangesAlert";
import { HealthcareProvider, ReferralReason } from "@/types/referral-slip";
import { promiseWrapper } from "@/lib/with-error-handling";

const updateReferralSlipSchema = z.object({
  reasonId: z.number().optional(),
  referredToId: z.number().optional(),
  history: z.string().optional(),
  impression: z.string().optional(),
  recommendation: z.string().optional(),
});

type ReferralSlipFormData = z.infer<typeof updateReferralSlipSchema>;

interface EditReferralSlipModalProps {
  referralSlip?: {
    id: number;
    serialNumber?: string;
    history?: string;
    impression?: string;
    recommendation?: string;
    Reason?: { id: number; name?: string; description?: string };
    ReferredTo?: {
      id: number;
      User?: {
        firstName?: string;
        lastName?: string;
      };
    };
    ClinicPatient?: {
      id: number;
      Patient?: {
        id: number;
        firstName?: string;
        lastName?: string;
      };
    };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  hpIds: number[];
  clinicUid?: string;
}

export default function EditReferralSlipModal({
  referralSlip,
  open,
  onOpenChange,
  onUpdated,
  hpIds,
  clinicUid
}: EditReferralSlipModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const { result: referralReasons } = useReferralReasons();
  const { data: hps } = useHPs({ clinicUid });

  const healthcareProviders = React.useMemo(() => {
    if (!hps) return [];
    return hps.map(hp => ({
      id: hp.id,
      User: hp.User,
      HPType: hp.HPType,
    }));
  }, [hps]);

  const form = useForm<ReferralSlipFormData>({
    resolver: zodResolver(updateReferralSlipSchema),
    defaultValues: {
      reasonId: referralSlip?.Reason?.id || undefined,
      referredToId: referralSlip?.ReferredTo?.id || undefined,
      history: referralSlip?.history || "",
      impression: referralSlip?.impression || "",
      recommendation: referralSlip?.recommendation || "",
    },
  });

  // Update form values when referralSlip changes
  useEffect(() => {
    if (referralSlip && open) {
      form.reset({
        reasonId: referralSlip.Reason?.id || undefined,
        referredToId: referralSlip.ReferredTo?.id || undefined,
        history: referralSlip.history || "",
        impression: referralSlip.impression || "",
        recommendation: referralSlip.recommendation || "",
      });
    }
  }, [referralSlip, open, form]);

  const handleSubmit = useCallback(
    async (data: ReferralSlipFormData) => {
      if (!referralSlip?.id) return;

      setIsLoading(true);
      toast.promise(promiseWrapper(updateReferralSlipAction)({
        id: referralSlip.id,
        hpIds,
        ...data,
      }), {
        loading: "Updating referral slip...",
        success: (res) => {
          setIsLoading(false);
          onUpdated?.();
          onOpenChange(false);
          return res.message;
        },
        error: (error) => {
          setIsLoading(false);
          console.error("Failed to update referral slip:", error);
          return "Failed to update referral slip";
        },
      });
    },
    [referralSlip?.id, hpIds, onUpdated, onOpenChange]
  );

  const hasUnsavedChanges = useCallback(() => {
    const values = form.getValues();
    const initialValues = {
      reasonId: referralSlip?.Reason?.id || undefined,
      referredToId: referralSlip?.ReferredTo?.id || undefined,
      history: referralSlip?.history || "",
      impression: referralSlip?.impression || "",
      recommendation: referralSlip?.recommendation || "",
    };

    return !!(
      values.reasonId !== initialValues.reasonId ||
      values.referredToId !== initialValues.referredToId ||
      (values.history ?? "") !== (initialValues.history ?? "") ||
      (values.impression ?? "") !== (initialValues.impression ?? "") ||
      (values.recommendation ?? "") !== (initialValues.recommendation ?? "")
    );
  }, [form, referralSlip]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges()) {
      setShowAlert(true);
    } else {
      if (!newOpen) {
        form.reset();
      }
      onOpenChange(newOpen);
    }
  }, [form, onOpenChange, hasUnsavedChanges]);

  const handleConfirmClose = useCallback(() => {
    setShowAlert(false);
    form.reset();
    onOpenChange(false);
  }, [form, onOpenChange]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Referral Slip</DialogTitle>
            <DialogDescription>
              Update the referral slip for {referralSlip?.ClinicPatient?.Patient?.firstName} {referralSlip?.ClinicPatient?.Patient?.lastName}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reasonId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Reason</FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          placeholder="Select referral reason..."
                          options={
                            referralReasons?.map((reason: ReferralReason) => ({
                              label: reason.name || "",
                              value: reason.id,
                            })) || []
                          }
                          value={field.value}
                          onSelect={(option) => {
                            field.onChange(option.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referredToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred To</FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          placeholder="Select healthcare provider..."
                          options={
                            healthcareProviders?.map((provider: HealthcareProvider) => ({
                              label: `${provider.User?.firstName || ""} ${provider.User?.lastName || ""} - ${provider.HPType?.name || ""}`,
                              value: provider.id,
                            })) || []
                          }
                          value={field.value}
                          onSelect={(option) => {
                            field.onChange(option.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="history"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>History</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter patient history..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impression"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impression</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter clinical impression..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommendation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter recommendations..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Referral Slip"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <UnsavedChangesAlert
        open={showAlert}
        onOpenChange={setShowAlert}
        onConfirm={handleConfirmClose}
        onCancel={() => setShowAlert(false)}
      />
    </>
  );
}
