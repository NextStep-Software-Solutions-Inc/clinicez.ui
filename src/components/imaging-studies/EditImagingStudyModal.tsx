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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import ActionButton from "@/components/ActionButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { updateImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { ImagingStudy } from "./ImagingStudiesItem";
import { PatientProfile } from "../consultation/ConsultationDetails";
import ImagingDiagnosticsMultiSelect from "@/components/ImagingDiagnosticsMultiSelect";

const formSchema = z.object({
  history: z.string().optional(),
  reason: z.string().optional(),
  impression: z.string().optional(),
  diagnostics: z.array(z.number()).min(1, {
    message: "Please select at least one diagnostic",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface EditImagingStudyModalProps {
  study: ImagingStudy;
  userInfo?: PatientProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  hpIds: number[];
}

export default function EditImagingStudyModal({
  study,
  userInfo,
  open,
  onOpenChange,
  onUpdated,
  hpIds,
}: EditImagingStudyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [originalValues, setOriginalValues] = useState<FormData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      history: "",
      reason: "",
      impression: "",
      diagnostics: [],
    },
    mode: "onChange",
  });

  const resetForm = useCallback(() => {
    form.reset({
      history: "",
      reason: "",
      impression: "",
      diagnostics: [],
    });
  }, [form]);

  useEffect(() => {
    if (open && study) {
      const diagnosticIds = study.ImagingRequestDiagnostics?.map(
        (diag) => diag.ImagingDiagnostic.id
      ) || [];

      const values = {
        history: study.history || "",
        reason: study.reason || "",
        impression: study.impression || "",
        diagnostics: diagnosticIds,
      };
      form.setValue("history", values.history);
      form.setValue("reason", values.reason);
      form.setValue("impression", values.impression);
      form.setValue("diagnostics", values.diagnostics);
      setOriginalValues(values);
    } else if (!open) {
      resetForm();
    }
  }, [open, study, form, resetForm]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!originalValues) return false;
    const currentValues = form.getValues();
    return (
      currentValues.history !== originalValues.history ||
      currentValues.reason !== originalValues.reason ||
      currentValues.impression !== originalValues.impression ||
      JSON.stringify(currentValues.diagnostics.sort()) !== JSON.stringify(originalValues.diagnostics.sort())
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
    setIsLoading(true);
    toast.promise(promiseWrapper(updateImagingStudyAction)({
      id: study.id,
      history: data.history,
      reason: data.reason,
      impression: data.impression,
      diagnosticIds: data.diagnostics,
      hpIds: hpIds,
    }), {
      loading: "Updating imaging study...",
      success: (result) => {
        onUpdated?.();
        onOpenChange(false);
        return result.message || "Imaging study updated successfully!";
      },
      error: (error) => {
        return error as string;
      },
      finally: () => {
        setIsLoading(false);
      },
    });
  }, [study.id, onUpdated, onOpenChange, hpIds]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Imaging Study</DialogTitle>
            <DialogDescription>
              Update the imaging study details for {userInfo?.firstName} {userInfo?.lastName}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="edit-imaging-study-form">
              <FormField
                control={form.control}
                name="diagnostics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnostics <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <ImagingDiagnosticsMultiSelect
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select diagnostics"
                        disabled={isLoading}
                        searchPlaceholder="Type to search diagnostics..."
                        minSearchLength={2}
                      />
                    </FormControl>
                    <FormDescription>
                      Select the relevant diagnostics for this imaging study.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-4 py-2">
                <FormField
                  control={form.control}
                  name="history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>History</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Enter patient history..."
                          {...field}
                          className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a brief history of the patient&apos;s condition. (Optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Enter reason for imaging..."
                          {...field}
                          className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a brief reason for the imaging request. (Optional)
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
                          placeholder="Enter clinical impression..."
                          {...field}
                          className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a brief clinical impression based on the patient&apos;s condition. (Optional)
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
                  form="edit-imaging-study-form"
                  className="bg-black text-white hover:bg-black/90"
                >
                  {isLoading ? "Updating..." : "Update Study"}
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
