"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { UnsavedChangesAlert } from "@/components/UnsavedChangesAlert";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Checkbox } from "@components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import Each from "@components/utils/Each";
import ActionButton from "@/components/ActionButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import {
  updateMedicalCertificateAction,
  getMedicalCertificateReasonsAction,
  getMedicalCertificateFindingsAction,
  getMedicalCertificateClassificationsAction,
  type GetMedicalCertificateReasons,
  type GetMedicalCertificateFindings,
  type GetMedicalCertificateClassifications
} from "@/actions/clinics/clinical-record/medical-certificate.action";
import { MedicalCertificate } from "./MedicalCertificateItem";

const formSchema = z.object({
  selectedReason: z.string({
    required_error: "Please select a reason",
  }).min(1, { message: "Please select a reason" }),
  findings: z.string({
    required_error: "Please select findings",
  }).min(1, { message: "Please select findings" }),
  medicalClassification: z.string({
    required_error: "Please select a medical classification",
  }).min(1, { message: "Please select a medical classification" }),
  remarks: z.string().optional(),
  impression: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditMedicalCertificateModalProps {
  certificate: MedicalCertificate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  hpIds: number[];
}

export default function EditMedicalCertificateModal({
  certificate,
  open,
  onOpenChange,
  onUpdated,
  hpIds,
}: EditMedicalCertificateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [originalValues, setOriginalValues] = useState<FormData | null>(null);
  const [reasons, setReasons] = useState<GetMedicalCertificateReasons["data"]>([]);
  const [findings, setFindings] = useState<GetMedicalCertificateFindings["data"]>([]);
  const [classifications, setClassifications] = useState<GetMedicalCertificateClassifications["data"]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedReason: "",
      findings: "",
      medicalClassification: "",
      remarks: "",
      impression: "",
    },
    mode: "onChange",
  });

  const resetForm = useCallback(() => {
    form.reset({
      selectedReason: "",
      findings: "",
      medicalClassification: "",
      remarks: "",
      impression: "",
    });
  }, [form]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reasonsRes, findingsRes, classificationsRes] = await Promise.all([
          getMedicalCertificateReasonsAction(),
          getMedicalCertificateFindingsAction(),
          getMedicalCertificateClassificationsAction(),
        ]);

        setReasons(reasonsRes.data);
        setFindings(findingsRes.data);
        setClassifications(classificationsRes.data);

        const values = {
          selectedReason: "",
          findings: "",
          medicalClassification: "",
          remarks: certificate.remarks || "",
          impression: certificate.impression || "",
        };

        if (certificate.Reason && reasonsRes.data) {
          const reason = reasonsRes.data.find(r => r.name === certificate.Reason?.name);
          if (reason) {
            values.selectedReason = reason.name;
            form.setValue("selectedReason", reason.name);
          }
        }
        if (certificate.Finding && findingsRes.data) {
          const finding = findingsRes.data.find(f => f.name === certificate.Finding?.name);
          if (finding) {
            values.findings = finding.name;
            form.setValue("findings", finding.name);
          }
        }
        if (certificate.Classification && classificationsRes.data) {
          const classification = classificationsRes.data.find(c => c.name === certificate.Classification?.name);
          if (classification) {
            values.medicalClassification = classification.name;
            form.setValue("medicalClassification", classification.name);
          }
        }

        if (certificate.remarks) {
          form.setValue("remarks", certificate.remarks);
        }

        if (certificate.impression) {
          values.impression = certificate.impression;
          form.setValue("impression", certificate.impression);
        }

        setOriginalValues(values);
      } catch (error) {
        toast.error(getActionErrorMessage(error, "Failed to load form data"));
      }
    };

    if (open) {
      loadData();
    } else {
      resetForm();
    }
  }, [open, certificate, form, resetForm, reasons?.length, findings?.length, classifications?.length]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!originalValues) return false;
    const currentValues = form.getValues();
    return (
      currentValues.selectedReason !== originalValues.selectedReason ||
      currentValues.findings !== originalValues.findings ||
      currentValues.medicalClassification !== originalValues.medicalClassification ||
      currentValues.remarks !== originalValues.remarks ||
      currentValues.impression !== originalValues.impression
    );
  }, [form, originalValues]);

  const handleClose = useCallback((newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges()) {
      setShowAlert(true);
    } else {
      onOpenChange?.(newOpen);
    }
  }, [hasUnsavedChanges, onOpenChange]);

  const handleConfirmClose = useCallback(() => {
    setShowAlert(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const onSubmit = useCallback(async (data: FormData) => {
    const reason = reasons?.find(r => r.name === data.selectedReason);
    const finding = findings?.find(f => f.name === data.findings);
    const classification = classifications?.find(c => c.name === data.medicalClassification);

    if (!reason || !finding || !classification) {
      toast.error("Please select valid reason, finding, and classification.");
      return;
    }

    setIsLoading(true);
    toast.promise(promiseWrapper(updateMedicalCertificateAction)({
      id: certificate.id,
      reasonId: reason.id,
      findingId: finding.id,
      classificationId: classification.id,
      remarks: data.remarks,
      impression: data.impression,
      hpIds: hpIds,
    }), {
      loading: "Updating medical certificate...",
      success: (result) => {
        onUpdated?.();
        onOpenChange(false);
        return result.message || "Medical certificate updated successfully!";
      },
      error: (error) => {
        return error as string;
      },
      finally: () => {
        setIsLoading(false);
      },
    });
  }, [certificate.id, reasons, findings, classifications, onUpdated, onOpenChange, hpIds]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Medical Certificate</DialogTitle>
            <DialogDescription>
              Update the medical certificate details for {certificate.ClinicPatient?.Patient?.firstName} {certificate.ClinicPatient?.Patient?.lastName}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="edit-medical-certificate-form">
              <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-4 py-2">
                <FormField
                  control={form.control}
                  name="selectedReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <Each
                            of={reasons || []}
                            render={(reason) => (
                              <div
                                key={reason.id}
                                className="w-full rounded-lg border p-3 flex items-center gap-2"
                                tabIndex={-1}
                                style={{ outline: "none" }}
                              >
                                <Checkbox
                                  checked={field.value === reason.name}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange(reason.name)
                                    }
                                  }}
                                  className="cursor-pointer"
                                />
                                <span className="font-normal text-sm select-none">{reason.name}</span>
                              </div>
                            )}
                            fallback={
                              <FormItem className="flex items-center justify-center">
                                <FormLabel className="text-sm text-muted-foreground">No reasons available</FormLabel>
                              </FormItem>
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="findings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Findings</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-3 gap-4"
                        >
                          <Each
                            of={findings || []}
                            render={(finding) => (
                              <div
                                key={finding.id}
                                className="w-full rounded-lg border p-3 flex items-center justify-center"
                                tabIndex={-1}
                                style={{ outline: "none" }}
                              >
                                <FormItem className="flex flex-row items-center justify-center gap-2 w-full">
                                  <FormControl>
                                    <RadioGroupItem value={finding.name} className="cursor-pointer" />
                                  </FormControl>
                                  <FormLabel
                                    htmlFor={finding.name}
                                    className="font-normal text-center self-center text-sm select-none cursor-pointer"
                                  >
                                    {finding.name}
                                  </FormLabel>
                                </FormItem>
                              </div>
                            )}
                            fallback={
                              <FormItem className="flex items-center justify-center">
                                <FormControl>
                                  <RadioGroupItem value="" disabled className="cursor-not-allowed" />
                                </FormControl>
                                <FormLabel className="text-sm text-muted-foreground">No findings available</FormLabel>
                              </FormItem>
                            }
                          />
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicalClassification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Classification</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col gap-3">
                          <Each
                            of={classifications || []}
                            render={(item) => (
                              <div key={item.id} className="w-full rounded-lg border p-3 flex items-center gap-3">
                                <FormItem className="flex items-center gap-3 w-full">
                                  <FormControl>
                                    <RadioGroupItem value={item.name} />
                                  </FormControl>
                                  <div className="flex flex-col w-full">
                                    <FormLabel className="font-normal cursor-pointer">{item.name}</FormLabel>
                                    {item.description && (
                                      <span className="text-xs text-muted-foreground mt-1">{item.description}</span>
                                    )}
                                  </div>
                                </FormItem>
                              </div>
                            )}
                            fallback={
                              <FormItem className="flex items-center justify-center">
                                <FormControl>
                                  <RadioGroupItem value="" disabled className="cursor-not-allowed" />
                                </FormControl>
                                <FormLabel className="text-sm text-muted-foreground">No classifications available</FormLabel>
                              </FormItem>
                            }
                          />
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendations</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Enter Recommendations/Remarks"
                          {...field}
                          className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide any recommendations or remarks. (Optional)
                      </FormDescription>
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
                        <textarea
                          placeholder="Enter Impression"
                          {...field}
                          className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a brief impression of the patient&apos;s condition. (Optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <ActionButton
                  type="submit"
                  disabled={isLoading}
                  form="edit-medical-certificate-form"
                  className="bg-black text-white hover:bg-black/90"
                >
                  {isLoading ? "Updating..." : "Update Certificate"}
                </ActionButton>
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
