"use client"

import ActionButton from "@/components/ActionButton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UnsavedChangesAlert } from "@/components/UnsavedChangesAlert"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Each from "@/components/utils/Each"
import { zodResolver } from "@hookform/resolvers/zod"
import React, { useCallback } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  getMedicalCertificateReasonsAction,
  getMedicalCertificateFindingsAction,
  getMedicalCertificateClassificationsAction,
  createMedicalCertificateAction,
} from "@/actions/clinics/clinical-record/medical-certificate.action";
import { calculateAge, cn } from "@/lib/utils"
import { PatientProfile } from "@/components/consultation/ConsultationDetails"
import { promiseWrapper } from "@/lib/with-error-handling"
import { FileIcon, User, ChevronDown, ChevronUp } from "lucide-react"

type MedicalCertificateReason = {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  documentTemplateId?: number;
};

type MedicalCertificateFinding = {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  documentTemplateId?: number;
};

type MedicalCertificateClassification = {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  documentTemplateId?: number;
};

function useMedicalCertificateOptions() {
  const [reasons, setReasons] = React.useState<MedicalCertificateReason[]>([]);
  const [findings, setFindings] = React.useState<MedicalCertificateFinding[]>([]);
  const [classifications, setClassifications] = React.useState<MedicalCertificateClassification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchOptions() {
      setLoading(true);
      try {
        const [reasonsRes, findingsRes, classificationsRes] = await Promise.all([
          getMedicalCertificateReasonsAction(),
          getMedicalCertificateFindingsAction(),
          getMedicalCertificateClassificationsAction(),
        ]);
        setReasons(reasonsRes?.data || []);
        setFindings(findingsRes?.data || []);
        setClassifications(classificationsRes?.data || []);
      } finally {
        setLoading(false);
      }
    }
    fetchOptions();
  }, []);

  return { reasons, findings, classifications, loading };
}

const createMedicalCertificateSchema = z.object({
  patientName: z
    .string({
      required_error: "Please provide the patient's name",
    })
    .trim()
    .min(3, {
      message: "Patient's name must be at least 3 characters long",
    }),
  age: z
    .number({
      required_error: "Please provide the patient's age",
    })
    .min(0, {
      message: "Age must be a positive number",
    }),
  dob: z.date()
    .refine((val) => {
      const today = new Date();
      return val <= today;
    }, "Date of birth cannot be in the future")
    .optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  address: z
    .string()
    .trim()
    .optional()
    .refine(val => !val || val.length >= 5, {
      message: "Address must be at least 5 characters long",
    }),
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
})

interface CreateMedicalCertificateModalProps {
  clinicUid: string
  onCreateMedicalCertificate?: () => void
  userInfo?: PatientProfile | null
  patientId?: number
  hpIds: number[]
  consultationTicketId: number
}


export default function CreateMedicalCertificateModal({
  onCreateMedicalCertificate,
  userInfo,
  clinicUid,
  patientId,
  hpIds,
  consultationTicketId,
}: CreateMedicalCertificateModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showAlert, setShowAlert] = React.useState(false);
  const [showPatientInfo, setShowPatientInfo] = React.useState(false);

  const { reasons, findings, classifications, loading } = useMedicalCertificateOptions();
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
    }
  }, [userInfo])

  const form = useForm<z.infer<typeof createMedicalCertificateSchema>>({
    resolver: zodResolver(createMedicalCertificateSchema),
    defaultValues: autofillDefaults,
  })

  const resetFormWithDefaults = useCallback(() => {
    form.reset(autofillDefaults);
  }, [form, autofillDefaults]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const formValues = form.getValues();
    return !!(
      formValues.selectedReason ||
      formValues.findings ||
      formValues.medicalClassification ||
      (formValues.remarks && formValues.remarks.trim()) ||
      (formValues.impression && formValues.impression.trim())
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

  const handleSubmit = useCallback(async (values: z.infer<typeof createMedicalCertificateSchema>) => {
    const reason = reasons.find(r => r.name === values.selectedReason);
    const finding = findings.find(f => f.name === values.findings);
    const classification = classifications.find(c => c.name === values.medicalClassification);

    const documentTemplateId = reason?.documentTemplateId || classification?.documentTemplateId || finding?.documentTemplateId;

    const remarks = values.remarks;
    const impression = values.impression;

    if (!reason || !finding || !classification || !documentTemplateId) {
      toast.error("Please select valid reason, finding, and classification.");
      return;
    }

    setIsSubmitting(true);
    toast.promise(promiseWrapper(createMedicalCertificateAction)({
      clinicUid,
      patientId,
      documentTemplateId,
      hpIds,
      reasonId: reason.id,
      findingId: finding.id,
      classificationId: classification.id,
      remarks,
      impression,
      consultationTicketId,
    }), {
      loading: "Creating medical certificate...",
      success: (data) => {
        onCreateMedicalCertificate?.();
        setOpen(false);
        resetFormWithDefaults();
        return data.message || "Medical certificate created successfully!";
      },
      error: (error) => {
        return error as string;
      },
      finally: () => {
        setIsSubmitting(false);
      },
    });
  }, [reasons, findings, classifications, clinicUid, patientId, hpIds, consultationTicketId, onCreateMedicalCertificate, resetFormWithDefaults]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} id="create-medical-certificate-form">
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <FileIcon className="h-4 w-4" />
                Add Medical Certificate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full">
              <DialogHeader>
                <DialogTitle>Create Medical Certificate</DialogTitle>
                <DialogDescription>
                  Fill out the details below to create a medical certificate. Click save when you&apos;re done.
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
                </Card>
                <FormField
                  control={form.control}
                  name="selectedReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <Each
                            of={reasons}
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
                      <FormLabel>Findings <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-3 gap-4"
                        >
                          <Each
                            of={findings}
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
                      <FormLabel>Medical Classification <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col gap-3">
                          <Each
                            of={classifications}
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
                          id="remarks"
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
                          id="impression"
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
                  form="create-medical-certificate-form"
                  className="bg-black text-white hover:bg-black/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
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
