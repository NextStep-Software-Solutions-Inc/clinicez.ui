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
import Each from "@components/utils/Each";
import ActionButton from "@/components/ActionButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { updateLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { LaboratoryRequest } from "./LaboratoryRequestItem";
import { useLaboratoryDiagnostics } from "@/hooks/useLaboratoryDiagnostics";
import { cn, getGridCols } from "@/lib/utils";

const formSchema = z.object({
  impression: z.string().optional(),
  diagnosticIds: z.array(z.number()).min(1, "Please select at least one diagnostic test"),
});

type FormData = z.infer<typeof formSchema>;

interface EditLaboratoryRequestModalProps {
  request: LaboratoryRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  hpIds: number[];
}

export default function EditLaboratoryRequestModal({
  request,
  open,
  onOpenChange,
  onUpdated,
  hpIds,
}: EditLaboratoryRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [originalValues, setOriginalValues] = useState<FormData | null>(null);
  const { data: diagnosticsData, isLoading: diagnosticsLoading } = useLaboratoryDiagnostics();

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

  const diagnostics = useMemo(() => diagnosticsData?.data || [], [diagnosticsData?.data]);

  const groupedDiagnostics = useMemo(() => {
    const groups: Record<string, typeof diagnostics> = {};

    diagnostics.forEach((diagnostic) => {
      const category = diagnostic.category || 'UNCATEGORIZED';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(diagnostic);
    });

    return groups;
  }, [diagnostics]);

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
                      <FormLabel>Laboratory Tests</FormLabel>
                      <FormControl>
                        <div className="space-y-6">
                          {Object.keys(groupedDiagnostics).length > 0 ? (
                            Object.entries(groupedDiagnostics).map(([category, categoryDiagnostics]) => {
                              return (
                                <div key={category} className="space-y-3">
                                  <h4 className="font-semibold text-sm text-primary uppercase tracking-wide">
                                    {category}
                                  </h4>
                                  <div className={cn("grid gap-3", getGridCols(categoryDiagnostics.length))}>
                                    <Each
                                      of={categoryDiagnostics}
                                      render={(diagnostic) => (
                                        <div
                                          key={diagnostic.id}
                                          className="w-full rounded-lg border p-3 flex items-center gap-2"
                                          tabIndex={-1}
                                          style={{ outline: "none" }}
                                        >
                                          <Checkbox
                                            checked={field.value.includes(diagnostic.id)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                field.onChange([...field.value, diagnostic.id]);
                                              } else {
                                                field.onChange(field.value.filter(id => id !== diagnostic.id));
                                              }
                                            }}
                                            className="cursor-pointer"
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-normal text-xs select-none">{diagnostic.name}</span>
                                            {diagnostic.description && (
                                              <span className="text-[10px] text-muted-foreground">{diagnostic.description}</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex items-center justify-center py-8">
                              <span className="text-sm text-muted-foreground">
                                {diagnosticsLoading ? "Loading diagnostics..." : "No laboratory tests available"}
                              </span>
                            </div>
                          )}
                        </div>
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
