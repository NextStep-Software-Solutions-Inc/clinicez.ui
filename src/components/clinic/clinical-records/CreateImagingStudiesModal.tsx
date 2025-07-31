"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UnsavedChangesAlert } from "@/components/UnsavedChangesAlert";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAge, capitalize, cn } from "@/lib/utils";
import ActionButton from "@/components/ActionButton";
import { createImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import MultiSelect from "@/components/MultiSelect";
import { useImagingDiagnostics } from "@/hooks/useImagingDiagnostics";
import { PatientProfile } from "@/components/consultation/ConsultationDetails";
import { Plus, User, ChevronDown, ChevronUp } from "lucide-react";
import { promiseWrapper } from "@/lib/with-error-handling";

const GENDERS = [
  "MALE",
  "FEMALE",
];

const createImagingStudiesSchema = z.object({
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
  birthdate: z.date({
    required_error: "Please provide the patient's birthdate",
  }).refine(date => date <= new Date(), {
    message: "Birthdate cannot be in the future",
  }),
  gender: z.enum(["MALE", "FEMALE"], {
    required_error: "Please select the patient's gender",
  }),
  diagnostics: z.array(z.number()).min(1, {
    message: "Please select at least one diagnostic",
  }),
  history: z.string().trim().optional(),
  impression: z.string().trim().optional(),
  reason: z.string().trim().optional(),
});

interface CreateImagingStudiesModalProps {
  clinicUid: string;
  onCreateImagingStudy?: () => void;
  userInfo: PatientProfile | null;
  patientId?: number;
  hpIds: number[];
  consultationTicketId: number;
}

export default function CreateImagingStudiesModal({ clinicUid, onCreateImagingStudy, userInfo, patientId, hpIds, consultationTicketId }: CreateImagingStudiesModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showAlert, setShowAlert] = React.useState(false);
  const [showPatientInfo, setShowPatientInfo] = React.useState(false);

  const { result, loading } = useImagingDiagnostics();
  const diagnostics = result.map((diag) => ({
    ...diag,
    description: typeof diag.description === "string" ? diag.description : undefined,
  }));

  const autofillDefaults = React.useMemo(() => {
    return {
      patientName: [
        userInfo?.firstName,
        userInfo?.middleName,
        userInfo?.lastName,
        userInfo?.suffix,
      ]
        .filter(Boolean)
        .join(" "),
      age:
        userInfo?.dob
          ? calculateAge(userInfo.dob) : 0,
      address: userInfo?.address
        ? [
          userInfo.address?.homeAddress,
          userInfo.address?.city,
          userInfo.address?.state,
          userInfo.address?.zipCode,
          userInfo.address?.country,
        ].filter(Boolean).join(", ")
        : "",
      birthdate: userInfo?.dob ? new Date(userInfo.dob) : new Date(),
      gender: userInfo?.gender === "MALE" || userInfo?.gender === "FEMALE"
        ? userInfo.gender as "MALE" | "FEMALE"
        : undefined,
      diagnostics: [] as number[],
    }
  }, [userInfo]);

  const form = useForm<z.infer<typeof createImagingStudiesSchema>>({
    resolver: zodResolver(createImagingStudiesSchema),
    defaultValues: autofillDefaults,
  });

  const resetFormWithDefaults = useCallback(() => {
    form.reset(autofillDefaults);
  }, [form, autofillDefaults]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const formValues = form.getValues();
    return !!(
      formValues.diagnostics?.length > 0 ||
      (formValues.history && formValues.history.trim()) ||
      (formValues.impression && formValues.impression.trim()) ||
      (formValues.reason && formValues.reason.trim())
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

  React.useEffect(() => {
    if (open) {
      resetFormWithDefaults();
    }
  }, [open, resetFormWithDefaults]);

  const action = useCallback(async (values: z.infer<typeof createImagingStudiesSchema>) => {
    if (!patientId || !hpIds || hpIds.length === 0) {
      toast.error("Missing required patient or healthcare provider information.");
      return;
    }

    setIsSubmitting(true);
    toast.promise(promiseWrapper(createImagingStudyAction)({
      clinicUid,
      patientId,
      hpIds,
      consultationTicketId,
      diagnosticIds: values.diagnostics,
      ...values,
    }), {
      loading: "Creating imaging study request...",
      success: (result) => {
        setOpen(false);
        resetFormWithDefaults();
        onCreateImagingStudy?.();
        return result.message || "Imaging study request created successfully!";
      },
      error: (error) => {
        return error as string;
      },
      finally: () => {
        setIsSubmitting(false);
      },
    });
  }, [patientId, hpIds, clinicUid, consultationTicketId, resetFormWithDefaults, onCreateImagingStudy]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(action)} id="add-imaging-study-form">
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full">
              {/* Header */}
              <DialogHeader>
                <DialogTitle>Create Imaging Studies Request</DialogTitle>
                <DialogDescription>
                  Fill in the patient information and imaging study details.
                </DialogDescription>
              </DialogHeader>

              {/* Body */}
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
                          name="birthdate"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs font-medium text-gray-600">Birthdate</FormLabel>
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
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-row gap-6 pt-1"
                                  disabled
                                >
                                  {GENDERS.map((gender) => (
                                    <div key={gender} className="flex items-center gap-2">
                                      <RadioGroupItem value={gender} className="cursor-pointer" />
                                      <FormLabel htmlFor={gender} className="font-normal text-sm select-none cursor-pointer text-gray-600">
                                        {capitalize(gender)}
                                      </FormLabel>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>

                <FormField
                  control={form.control}
                  name="diagnostics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnostics <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={diagnostics}
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder={loading ? "Loading diagnostics..." : "Select diagnostics"}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>History (Optional)</FormLabel>
                      <FormControl>
                        <textarea
                          id="history"
                          placeholder="Medical history..."
                          className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary"
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
                      <FormLabel>Impression (Optional)</FormLabel>
                      <FormControl>
                        <textarea
                          id="impression"
                          placeholder="Impression..."
                          className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (Optional)</FormLabel>
                      <FormControl>
                        <textarea
                          id="reason"
                          placeholder="Reason for imaging study..."
                          className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary"
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
                  form="add-imaging-study-form"
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