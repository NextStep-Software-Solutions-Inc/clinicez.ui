"use client"

import ActionButton from "@/components/ActionButton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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
import { calculateAge } from "@/lib/utils"
import { PatientProfile } from "@/components/consultation/ConsultationDetails"
import { promiseWrapper } from "@/lib/with-error-handling"
import { FileIcon } from "lucide-react"

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
})

interface CreateMedicalCertificateModalProps {
  clinicUid: string
  onCreateMedicalCertificate?: () => void
  userInfo?: PatientProfile | null
  patientId?: number
  hpId?: number
  consultationTicketId?: number
}


export default function CreateMedicalCertificateModal({
  onCreateMedicalCertificate,
  userInfo,
  clinicUid,
  patientId,
  hpId,
  consultationTicketId,
}: CreateMedicalCertificateModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

    if (!reason || !finding || !classification || !documentTemplateId) {
      toast.error("Please select valid reason, finding, and classification.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await promiseWrapper(createMedicalCertificateAction)({
        clinicUid,
        patientId,
        documentTemplateId,
        hpId,
        reasonId: reason.id,
        findingId: finding.id,
        classificationId: classification.id,
        remarks,
        consultationTicketId,
      });

      toast.success(result.message);
      onCreateMedicalCertificate?.();
      setOpen(false);
      resetFormWithDefaults();
    } catch (error) {
      toast.error(error as string);
    } finally {
      setIsSubmitting(false);
    }
  }, [reasons, findings, classifications, clinicUid, patientId, hpId, consultationTicketId, onCreateMedicalCertificate, resetFormWithDefaults]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                name="selectedReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
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
                    <FormLabel>Findings</FormLabel>
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
                    <FormLabel>Medical Classification</FormLabel>
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
                    <FormLabel>Recommendations/Remarks</FormLabel>
                    <FormControl>
                      <textarea
                        id="remarks"
                        placeholder="Enter Recommendations/Remarks"
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
  );
}
