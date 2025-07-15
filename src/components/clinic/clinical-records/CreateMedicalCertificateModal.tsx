"use client"

import ActionButton from "@/components/ActionButton"
import CustomModalContent from "@/components/CustomModalContent"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Each from "@/components/utils/Each"
import { zodResolver } from "@hookform/resolvers/zod"
import React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  getMedicalCertificateReasonsAction,
  getMedicalCertificateFindingsAction,
  getMedicalCertificateClassificationsAction,
  createMedicalCertificateAction,
} from "@/actions/clinics/clinical-record/medical-certificate.action";
import { generateSerialNumber } from "@/lib/utils"

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
    .string({
      required_error: "Please provide the patient's address",
    })
    .trim()
    .min(5, {
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
})

interface CreateMedicalCertificateModalProps {
  clinicUid: string
  onCreateMedicalCertificate?: () => void
  userInfo?: any
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

  const { reasons, findings, classifications, loading } = useMedicalCertificateOptions();
  const autofillDefaults = React.useMemo(() => {
    return {
      patientName:
        userInfo?.firstName && userInfo?.lastName
          ? `${userInfo.firstName} ${userInfo.lastName}`
          : "",
      age:
        userInfo?.dob
          ? Math.max(0, Math.floor((Date.now() - new Date(userInfo.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
          : 0,
      address: String(userInfo?.address || userInfo?.homeAddress || ""),
      selectedReason: reasons.length > 0 ? reasons[0].name : "",
      findings: findings.length > 0 ? findings[0].name : "",
      medicalClassification: classifications.length > 0 ? classifications[0].name : "",
    }
  }, [userInfo, reasons, findings, classifications])

  const form = useForm<z.infer<typeof createMedicalCertificateSchema>>({
    resolver: zodResolver(createMedicalCertificateSchema),
    defaultValues: autofillDefaults,
  })

  React.useEffect(() => {
    if (open) {
      form.reset(autofillDefaults);
    }
  }, [open, autofillDefaults, form]);

  // Reset form when autofillDefaults change and modal is open (e.g., after userInfo async fetch)
  React.useEffect(() => {
    if (open) {
      form.reset(autofillDefaults);
    }
  }, [autofillDefaults, open, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const reason = reasons.find(r => r.name === values.selectedReason);
    const finding = findings.find(f => f.name === values.findings);
    const classification = classifications.find(c => c.name === values.medicalClassification);

    const documentTemplateId = reason?.documentTemplateId || classification?.documentTemplateId || finding?.documentTemplateId;

    const serialNumber = generateSerialNumber();
    const remarks = ""; // Currently not used, can be added in future UI design.

    if (!reason || !finding || !classification || !documentTemplateId) {
      toast.error("Please select valid reason, finding, and classification.");
      return;
    }

    toast.promise(
      createMedicalCertificateAction({
        clinicUid,
        patientId,
        documentTemplateId,
        hpId,
        reasonId: reason.id,
        findingId: finding.id,
        classificationId: classification.id,
        serialNumber,
        remarks,
        consultationTicketId,
      }),
      {
        loading: "Creating medical certificate...",
        success: (res) => {
          onCreateMedicalCertificate?.()
          setOpen(false)
          form.reset(autofillDefaults)
          return res.message
        },
        error: (error) => error.message || "Failed to create medical certificate",
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full" onClick={() => setOpen(true)}>
                Create Medical Certificate
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>

      <CustomModalContent
        className="sm:max-w-[625px] max-h-[80vh] flex flex-col"
        label={<span className="text-lg font-semibold">Create Medical Certificate</span>}
        description={<span className="text-sm text-muted-foreground">Make changes to your profile here. Click save when you&apos;re done.</span>}
        headerClassName="sticky top-0 z-[20] bg-white px-4 pt-3 pb-2 border-b flex items-start"
      >
        <Form {...form}>
          <form onSubmit={handleSubmit} id="add-medical-certificate-form" className="flex-1 overflow-y-auto px-4 pb-24 pt-3 space-y-3">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input id="patientName" placeholder="Juan Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage>
                      Please provide the patient&apos;s name
                    </FormMessage>
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
                        type="number"
                        id="age"
                        placeholder="32"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input id="address" placeholder="123 Main Street, Quezon City, Metro Manila" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="selectedReason"
              render={({ field }) => (
                <FormItem className="space-y-2">
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="findings"
              render={({ field }) => (
                <FormItem className="space-y-2">
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicalClassification"
              render={({ field }) => (
                <FormItem className="space-y-2">
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
                </FormItem>
              )}
            />
          </form>
          <div className="sticky bottom-0 right-0 w-full bg-white px-4 py-3 flex justify-end border-t z-10">
            <ActionButton type="submit" form="add-medical-certificate-form" className="bg-black text-white hover:bg-black/90">
              <span className="text-sm">Save changes</span>
            </ActionButton>
          </div>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
