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
import { SearchableDropdown, SearchableDropdownOption } from "@components/ui/searchable-dropdown";
import { GroupedSearchableDropdown } from "@/components/ui/grouped-searchable-dropdown";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { z } from "zod";
import { updateReferralSlipAction } from "@actions/clinics/clinical-record/referral-slip.action";
import { UnsavedChangesAlert } from "@/components/UnsavedChangesAlert";
import { promiseWrapper } from "@/lib/with-error-handling";
import { formatHealthcareProviderName } from "@/lib/utils/format-healthcare-provider-name";
import { useReferralReasons } from "@/hooks/useReferralReasons";
import { useReferralTargets } from "@/hooks/useReferralTargets";

const updateReferralSlipSchema = z.object({
  reason: z.string().optional(),
  referredTo: z.string().optional(),
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
    reason?: string;
    referredTo?: string;
    Reason?: { id: number; name?: string; description?: string };
    ReferredTo?: {
      id: number;
      User?: {
        firstName?: string;
        lastName?: string;
      };
      HPType?: {
        name?: string;
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
  const { groups: referralTargetGroups } = useReferralTargets(clinicUid);

  const reasonOptions: SearchableDropdownOption[] = React.useMemo(() => {
    if (!referralReasons) return [];
    return referralReasons.map(reason => ({
      value: reason.name,
      label: reason.name,
      description: reason.description,
    }));
  }, [referralReasons]);

  const getReferralTargetValue = useCallback((slip?: typeof referralSlip): string => {
    if (!slip) return "";

    if (slip.referredTo) {
      return slip.referredTo;
    }

    if (slip.ReferredTo?.User) {
      const fullName = [
        slip.ReferredTo.User.firstName || '',
        slip.ReferredTo.User.lastName || ''
      ].join(' ').trim();

      if (slip.ReferredTo.HPType?.name) {
        return `${fullName} (${slip.ReferredTo.HPType.name})`;
      }

      return fullName || "Unknown Provider";
    }

    return "";
  }, []);

  const getReasonValue = useCallback((slip?: typeof referralSlip): string => {
    if (!slip) return "";

    if (slip.reason) {
      return slip.reason;
    }

    // Fallback
    return slip.Reason?.name || "";
  }, []);

  const form = useForm<ReferralSlipFormData>({
    resolver: zodResolver(updateReferralSlipSchema),
    defaultValues: {
      reason: getReasonValue(referralSlip),
      referredTo: getReferralTargetValue(referralSlip),
      history: referralSlip?.history || "",
      impression: referralSlip?.impression || "",
      recommendation: referralSlip?.recommendation || "",
    },
  });

  useEffect(() => {
    if (referralSlip && open) {
      form.reset({
        reason: getReasonValue(referralSlip),
        referredTo: getReferralTargetValue(referralSlip),
        history: referralSlip.history || "",
        impression: referralSlip.impression || "",
        recommendation: referralSlip.recommendation || "",
      });
    }
  }, [referralSlip, open, form, getReasonValue, getReferralTargetValue]);

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
      reason: getReasonValue(referralSlip),
      referredTo: getReferralTargetValue(referralSlip),
      history: referralSlip?.history || "",
      impression: referralSlip?.impression || "",
      recommendation: referralSlip?.recommendation || "",
    };

    return !!(
      values.reason !== initialValues.reason ||
      values.referredTo !== initialValues.referredTo ||
      (values.history ?? "") !== (initialValues.history ?? "") ||
      (values.impression ?? "") !== (initialValues.impression ?? "") ||
      (values.recommendation ?? "") !== (initialValues.recommendation ?? "")
    );
  }, [form, referralSlip, getReasonValue, getReferralTargetValue]);

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
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Reason</FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          options={reasonOptions}
                          value={field.value}
                          placeholder="Search or enter referral reason..."
                          onSelect={(option) => {
                            field.onChange(option.value);
                          }}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          renderOption={(option) => (
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              {option.description && (
                                <span className="text-sm text-muted-foreground">{option.description}</span>
                              )}
                            </div>
                          )}
                          emptyMessage="No referral reasons found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referredTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred To</FormLabel>
                      <FormControl>
                        <GroupedSearchableDropdown
                          groups={referralTargetGroups}
                          value={field.value}
                          placeholder="Search clinics or healthcare providers..."
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          onSelect={(option) => {
                            field.onChange(option.label);
                          }}
                          renderOption={(option) => (
                            <div className="flex items-center justify-between w-full">
                              <span>{option.label}</span>
                              {option.type === 'healthcare_provider' && option.specialty && (
                                <Badge variant="secondary" className="ml-2">
                                  {option.specialty}
                                </Badge>
                              )}
                              {option.type === 'clinic' && option.description && (
                                <span className="text-xs text-muted-foreground ml-2 truncate">
                                  {option.description}
                                </span>
                              )}
                            </div>
                          )}
                          emptyMessage="No clinics or healthcare providers found."
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
                <Button type="submit" disabled={isLoading} className="bg-black text-white hover:bg-gray-800">
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
