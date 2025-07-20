"use client";

import { useState, useEffect, useMemo } from "react";
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
}

export default function EditLaboratoryRequestModal({
  request,
  open,
  onOpenChange,
  onUpdated,
}: EditLaboratoryRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: diagnosticsData, isLoading: diagnosticsLoading } = useLaboratoryDiagnostics();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      impression: "",
      diagnosticIds: [],
    },
    mode: "onChange",
  });

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
      form.setValue("impression", request.impression || "");

      const existingDiagnosticIds = request.LaboratoryRequestDiagnostics?.map(
        item => item.LaboratoryDiagnostic.id
      ) || [];
      form.setValue("diagnosticIds", existingDiagnosticIds);
    } else if (!open) {
      form.reset({
        impression: "",
        diagnosticIds: [],
      });
    }
  }, [open, request, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await promiseWrapper(updateLaboratoryRequestAction)({
        id: request.id,
        impression: data.impression,
        diagnosticIds: data.diagnosticIds,
      });

      toast.success(result.message);
      onUpdated?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                            let gridCols = "grid-cols-1";
                            if (categoryDiagnostics.length >= 10) {
                              gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
                            } else if (categoryDiagnostics.length >= 6) {
                              gridCols = "grid-cols-1 md:grid-cols-2";
                            }

                            return (
                              <div key={category} className="space-y-3">
                                <h4 className="font-semibold text-sm text-primary uppercase tracking-wide">
                                  {category}
                                </h4>
                                <div className={`grid ${gridCols} gap-3`}>
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
                    <FormLabel>Impression (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Enter impression or notes..."
                        {...field}
                        className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary"
                      />
                    </FormControl>
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
  );
}
