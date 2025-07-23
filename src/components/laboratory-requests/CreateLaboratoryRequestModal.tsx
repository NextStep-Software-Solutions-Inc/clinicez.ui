"use client";

import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { UnsavedChangesAlert } from "@/components/UnsavedChangesAlert";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { createLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { Checkbox } from "@components/ui/checkbox";
import { useLaboratoryDiagnostics } from "@/hooks/useLaboratoryDiagnostics";
import { calculateAge, cn, getGridCols } from "@/lib/utils";
import Each from "@components/utils/Each";
import { PatientProfile } from "../consultation/ConsultationDetails";
import ActionButton from "../ActionButton";

const formSchema = z.object({
  patientName: z.string({
    required_error: "Please provide the patient's name",
  }).trim().min(3, {
    message: "Patient name must be at least 3 characters long",
  }),
  age: z.number({
    required_error: "Please provide the patient's age",
  }).min(0, {
    message: "Age must be a positive number",
  }),
  address: z.string({
    required_error: "Please provide the patient's address",
  }).trim().min(3, {
    message: "Address must be at least 3 characters long",
  }),
  impression: z.string().optional(),
  diagnosticIds: z.array(z.number()).min(1, "Please select at least one diagnostic test"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateLaboratoryRequestModalProps {
  clinicUid: string;
  patientId?: number;
  hpId?: number;
  onCreated?: () => void;
  userInfo: PatientProfile | null;
  consultationTicketId?: number;
}

export default function CreateLaboratoryRequestModal({
  clinicUid,
  patientId,
  hpId,
  onCreated,
  userInfo,
  consultationTicketId,
}: CreateLaboratoryRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const { data: diagnosticsData, isLoading: diagnosticsLoading } = useLaboratoryDiagnostics();

  const autofillDefaults = useMemo(() => {
    return {
      patientName: [
        userInfo?.firstName,
        userInfo?.middleName,
        userInfo?.lastName,
        userInfo?.suffix,
      ]
        .filter(Boolean)
        .join(" "),
      age: userInfo?.dob ? calculateAge(userInfo.dob) : 0,
      address: userInfo?.address
        ? [
          userInfo.address?.homeAddress,
          userInfo.address?.city,
          userInfo.address?.state,
          userInfo.address?.zipCode,
          userInfo.address?.country,
        ].filter(Boolean).join(", ")
        : "",
      impression: "",
      diagnosticIds: [] as number[],
    };
  }, [userInfo]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: autofillDefaults,
  });

  const resetFormWithDefaults = useCallback(() => {
    form.reset(autofillDefaults);
  }, [form, autofillDefaults]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const formValues = form.getValues();
    return !!(
      formValues?.diagnosticIds.length > 0 ||
      (formValues?.impression && formValues?.impression.trim())
    );
  }, [form]);

  const handleClose = useCallback((newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges()) {
      setShowAlert(true);
    } else {
      setOpen(newOpen);
      if (!newOpen) {
        resetFormWithDefaults();
      }
    }
  }, [hasUnsavedChanges, resetFormWithDefaults]);

  const handleConfirmClose = useCallback(() => {
    setShowAlert(false);
    setOpen(false);
    resetFormWithDefaults();
  }, [resetFormWithDefaults]);

  useEffect(() => {
    if (open) {
      resetFormWithDefaults();
    }
  }, [open, resetFormWithDefaults]);

  const handleSubmit = useCallback(async (data: FormData) => {
    if (!patientId || !hpId) {
      toast.error("Missing required patient or healthcare provider information.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await promiseWrapper(createLaboratoryRequestAction)({
        clinicUid,
        patientId,
        hpId,
        consultationTicketId,
        ...data,
      });

      toast.success(result.message);
      resetFormWithDefaults();
      setOpen(false);
      onCreated?.();
    } catch (error) {
      toast.error(error as string);
    } finally {
      setIsSubmitting(false);
    }
  }, [patientId, hpId, clinicUid, consultationTicketId, resetFormWithDefaults, onCreated]);

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

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} id="create-laboratory-request-form" className="space-y-4">
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full">
              <DialogHeader>
                <DialogTitle>Create Laboratory Request</DialogTitle>
                <DialogDescription>
                  Create a new laboratory request for the patient.
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-4 py-2">
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input id="patientName" placeholder="Juan Dela Cruz" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            id="age"
                            placeholder="32"
                            disabled
                            {...field}
                            onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input id="address" placeholder="123 Main Street, Quezon City, Metro Manila" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                        <Textarea
                          placeholder="Enter impression or reason for laboratory tests..."
                          className="resize-none"
                          rows={4}
                          {...field}
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
                  form="create-laboratory-request-form"
                  className="bg-black text-white hover:bg-black/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save changes"}
                </ActionButton>
              </DialogFooter>
            </DialogContent>
          </form>
        </Form>
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