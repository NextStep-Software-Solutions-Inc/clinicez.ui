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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, User, ChevronDown, ChevronUp } from "lucide-react";
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
  dob: z.date()
    .refine((val) => {
      const today = new Date();
      return val <= today;
    }, "Date of birth cannot be in the future")
    .optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
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
  hpIds: number[];
  onCreated?: () => void;
  userInfo: PatientProfile | null;
  consultationTicketId: number;
}

export default function CreateLaboratoryRequestModal({
  clinicUid,
  patientId,
  hpIds,
  onCreated,
  userInfo,
  consultationTicketId,
}: CreateLaboratoryRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
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
      dob: userInfo?.dob ? new Date(userInfo.dob) : undefined,
      gender: (userInfo?.gender === "MALE" || userInfo?.gender === "FEMALE") ? userInfo.gender as "MALE" | "FEMALE" : undefined,
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
    if (!patientId || !hpIds || hpIds.length === 0) {
      toast.error("Missing required patient or healthcare provider information.");
      return;
    }

    setIsSubmitting(true);
    toast.promise(promiseWrapper(createLaboratoryRequestAction)({
      clinicUid,
      patientId,
      hpIds,
      consultationTicketId,
      ...data,
    }), {
      loading: "Creating laboratory request...",
      success: (result) => {
        resetFormWithDefaults();
        setOpen(false);
        onCreated?.();
        return result.message || "Laboratory request created successfully!";
      },
      error: (error) => {
        return error as string;
      },
      finally: () => {
        setIsSubmitting(false);
      },
    });
  }, [patientId, hpIds, clinicUid, consultationTicketId, resetFormWithDefaults, onCreated]);

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

                {/* Patient Information Card */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors">
                  <CardHeader
                    className="cursor-pointer pb-3 hover:bg-gray-50/50 transition-colors rounded-t-lg"
                    onClick={() => setShowPatientInfo(!showPatientInfo)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold text-gray-700">
                            Patient Information
                          </CardTitle>
                          <CardDescription className="text-xs mt-1 flex items-center gap-4">
                            <span className="font-medium text-gray-600">
                              {userInfo?.firstName} {userInfo?.lastName}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">
                              Age: {userInfo?.dob ? calculateAge(userInfo.dob) : 'N/A'}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 hidden sm:block">
                          {showPatientInfo ? 'Collapse' : 'Expand'}
                        </span>
                        <div className={cn(
                          "p-1 rounded-full transition-all duration-200",
                          showPatientInfo ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                        )}>
                          {showPatientInfo ?
                            <ChevronUp className="h-4 w-4" /> :
                            <ChevronDown className="h-4 w-4" />
                          }
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {showPatientInfo && (
                    <CardContent className="pt-0 space-y-4 border-t border-gray-100">
                      <div className="flex gap-3 pt-4">
                        <FormField
                          control={form.control}
                          name="patientName"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs font-medium text-gray-600">Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  id="patientName"
                                  placeholder="Juan Dela Cruz"
                                  {...field}
                                  disabled
                                  className="bg-gray-50 text-gray-700 border-gray-200"
                                />
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
                              <FormLabel className="text-xs font-medium text-gray-600">Age</FormLabel>
                              <FormControl>
                                <Input
                                  id="age"
                                  placeholder="32"
                                  disabled
                                  {...field}
                                  onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                                  className="bg-gray-50 text-gray-700 border-gray-200"
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
                            <FormLabel className="text-xs font-medium text-gray-600">Address</FormLabel>
                            <FormControl>
                              <Input
                                id="address"
                                placeholder="123 Main Street, Quezon City, Metro Manila"
                                {...field}
                                disabled
                                className="bg-gray-50 text-gray-700 border-gray-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3">
                        <FormField
                          control={form.control}
                          name="dob"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs font-medium text-gray-600">Date of Birth</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  id="birthdate"
                                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                  onChange={e => field.onChange(new Date(e.target.value))}
                                  max={new Date().toISOString().split('T')[0]}
                                  disabled
                                  className="bg-gray-50 text-gray-700 border-gray-200"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs font-medium text-gray-600">Gender</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    value={field.value ? (field.value === 'MALE' ? 'Male' : 'Female') : 'Not specified'}
                                    disabled
                                    className="bg-gray-50 text-gray-700 border-gray-200"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>                <FormField
                  control={form.control}
                  name="diagnosticIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Laboratory Tests <span className="text-destructive">*</span></FormLabel>
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
                      <FormLabel>Impression (Optional)</FormLabel>
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