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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { createLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import ProcedureMultiSelect from "@/components/ProcedureMultiSelect";
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
  address: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  impression: z.string().optional(),
  diagnosticIds: z.array(z.number()).min(1, "Please select at least one procedure"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateLaboratoryRequestModalProps {
  clinicUid: string;
  clinicId: number;
  patientId?: number;
  hpIds: number[];
  onCreated?: () => void;
  userInfo: PatientProfile | null;
  consultationTicketId: number;
}

export default function CreateLaboratoryRequestModal({
  clinicUid,
  clinicId,
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
      age: calculateAge(userInfo?.dob) ?? 0,
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
                              Age: {calculateAge(userInfo?.dob) ?? 'N/A'}
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
                      <FormLabel>Laboratory Procedures <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <ProcedureMultiSelect
                          value={field.value || []}
                          onChange={field.onChange}
                          procedureType="laboratory"
                          clinicId={clinicId}
                          placeholder="Select laboratory procedures"
                          disabled={isSubmitting}
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
                          id="impression"
                          placeholder="Enter impression or reason for laboratory test"
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