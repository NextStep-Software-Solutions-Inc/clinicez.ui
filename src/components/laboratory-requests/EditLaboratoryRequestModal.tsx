"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Checkbox } from "@components/ui/checkbox";
import ProcedureMultiSelect from "@/components/ProcedureMultiSelect";
import Each from "@components/utils/Each";
import ActionButton from "@/components/ActionButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { updateLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { LaboratoryRequest } from "./LaboratoryRequestItem";
import { cn, getGridCols } from "@/lib/utils";

const formSchema = z.object({
  impression: z.string().optional(),
  diagnosticIds: z.array(z.number()).min(1, "Please select at least one procedure"),
});

type FormData = z.infer<typeof formSchema>;

interface EditLaboratoryRequestModalProps {
  request: LaboratoryRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  hpIds: number[];
  clinicId: number;
}

export default function EditLaboratoryRequestModal({
  request,
  open,
  onOpenChange,
  onUpdated,
  hpIds,
  clinicId,
}: EditLaboratoryRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [originalValues, setOriginalValues] = useState<FormData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      impression: "",
      diagnosticIds: [],
    },
    mode: "onChange",
  });

  const resetForm = useCallback(() => {
    form.reset({
      impression: "",
      diagnosticIds: [],
    });
  }, [form]);

  useEffect(() => {
    if (open && request) {
      const values = {
        impression: request.impression || "",
        diagnosticIds: request.LaboratoryRequestDiagnostics?.map(
          item => item.LaboratoryDiagnostic.id
        ) || [],
      };

      form.setValue("impression", values.impression);
      form.setValue("diagnosticIds", values.diagnosticIds);
      setOriginalValues(values);
    } else if (!open) {
      resetForm();
    }
  }, [open, request, form, resetForm]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!originalValues) return false;
    const currentValues = form.getValues();
    return (
      currentValues.impression !== originalValues.impression ||
      JSON.stringify(currentValues.diagnosticIds.sort()) !== JSON.stringify(originalValues.diagnosticIds.sort())
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
    toast.promise(promiseWrapper(updateLaboratoryRequestAction)({
      id: request.id,
      impression: data.impression,
      diagnosticIds: data.diagnosticIds,
      hpIds: hpIds,
    }), {
      loading: "Updating laboratory request...",
      success: (result) => {
        onUpdated?.();
        onOpenChange(false);
        return result.message || "Laboratory request updated successfully!";
      },
      error: (error) => {
        return error as string;
      },
      finally: () => {
        setIsLoading(false);
      },
    });
  }, [request.id, onUpdated, onOpenChange, hpIds]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Laboratory Request</DialogTitle>
            <DialogDescription>
              Update the laboratory request details for {request.ClinicPatient?.Patient?.firstName} {request.ClinicPatient?.Patient?.lastName}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="edit-laboratory-request-form">
              <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-4 py-2">
                <FormField
                  control={form.control}
                  name="diagnosticIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Laboratory Procedures</FormLabel>
                      <FormControl>
                        <ProcedureMultiSelect
                          value={field.value || []}
                          onChange={field.onChange}
                          procedureType="laboratory"
                          clinicId={clinicId}
                          placeholder="Select laboratory procedures"
                          disabled={isLoading}
                          searchPlaceholder="Type to search procedures..."
                          minSearchLength={2}
                        />
                      </FormControl>
                      <FormDescription>
                        Select the relevant laboratory procedures for this request.
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
                          placeholder="Enter impression or notes..."
                          {...field}
                          className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Brief summary of the patient&apos;s condition and any relevant findings. (Optional)
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
                  form="edit-laboratory-request-form"
                  className="bg-black text-white hover:bg-black/90"
                >
                  {isLoading ? "Updating..." : "Update Request"}
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
