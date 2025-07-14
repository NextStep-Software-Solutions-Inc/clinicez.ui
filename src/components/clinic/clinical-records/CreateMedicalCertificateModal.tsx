"use client"

import { createMedicalCertificateAction } from "@/actions/clinics/clinic.action"
import ActionButton from "@/components/ActionButton"
import CustomModalContent from "@/components/CustomModalContent"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Each from "@/components/utils/Each"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams } from "next/navigation"
import React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const REASONS = [
  "Physical Examination Only",
  "Physical Examination w/ X-Ray and Laboratory Results",
  "Consultation/Treatment",
]

const FINDINGS = ["Unremarkable", "Abnormal", "Normal"]

const MEDICAL_CLASSIFICATIONS = [
  {
    value: "Class A",
    label: "Class A",
    description: "Physically fit for any work",
  },
  {
    value: "Class B",
    label: "Class B",
    description:
      "Physically under-developed or with correctable defects, (error of refraction dental caries, defective hearing, and other similar defects) but otherwise fit to work",
  },
  {
    value: "Class C",
    label: "Class C",
    description:
      "Employable but owing to certain impairments or conditions, (heart disease, hypertension, anatomical defects) requires special placement or limited duty in a specified or selected assignment requiring follow-up treatment/periodic evaluation.",
  },
  {
    value: "Class D",
    label: "Class D",
    description:
      "Unfit or unsafe for any type of employment (active PTB, advanced heart disease with threatened failure, malignant hypertension, and other similar illnesses)",
  },
]

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
  selectedReason: z.enum(
    ["Physical Examination Only", "Physical Examination w/ X-Ray and Laboratory Results", "Consultation/Treatment"],
    {
      required_error: "Please select a reason",
    },
  ),
  findings: z.enum(["Unremarkable", "Abnormal", "Normal"], {
    required_error: "Please select findings",
  }),
  medicalClassification: z.enum(["Class A", "Class B", "Class C", "Class D"], {
    required_error: "Please select a medical classification",
  }),
})

interface CreateMedicalCertificateModalProps {
  clinicUid: string
  onCreateMedicalCertificate?: () => void
  userInfo?: any
}

export default function CreateMedicalCertificateModal({
  onCreateMedicalCertificate,
  userInfo,
  clinicUid,
}: CreateMedicalCertificateModalProps) {
  const closeBtnRef = React.useRef<HTMLInputElement>(null)

  // Autofill logic for defaultValues
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
      selectedReason: "Physical Examination Only" as const,
      findings: "Unremarkable" as const,
      medicalClassification: "Class A" as const,
    }
  }, [userInfo])

  const form = useForm<z.infer<typeof createMedicalCertificateSchema>>({
    resolver: zodResolver(createMedicalCertificateSchema),
    defaultValues: autofillDefaults,
  })

  const action = async () => {
    form.handleSubmit(async (values) => {
      toast.promise(
        createMedicalCertificateAction({
          ...values,
          clinicUid,
        }),
        {
          loading: "Creating medical certificate...",
          success: (res) => {
            if (res.status) {
              onCreateMedicalCertificate?.()
              closeBtnRef.current?.click()
            }
            return res.message
          },
          error: (error) => error.message || "Failed to create medical certificate",
        },
      )
    })()
  }

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                Create Medical Certificate
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>

      <CustomModalContent
        className="sm:max-w-[625px] overflow-scroll max-h-[80vh]"
        label="Create Medical Certificate"
        description={`Make changes to your profile here. Click save when you're done.`}
      >
        <Form {...form}>
          <form action={action} id="add-medical-certificate-form" className="space-y-4">
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

            {/* Fixed Reasons Section - Yes, have to do it this way though */}
            <FormField
              control={form.control}
              name="selectedReason"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      {REASONS.map((reason) => (
                        <div
                          key={reason}
                          className="w-full rounded-lg border p-3 flex items-center gap-2"
                          tabIndex={-1}
                          style={{ outline: "none" }}
                        >
                          <Checkbox
                            checked={field.value === reason}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange(reason)
                              }
                            }}
                            className="cursor-pointer"
                          />
                          <span className="font-normal text-sm select-none">{reason}</span>
                        </div>
                      ))}
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
                      {FINDINGS.map((finding) => (
                        <div
                          key={finding}
                          className="w-full rounded-lg border p-3 flex items-center justify-center"
                          tabIndex={-1}
                          style={{ outline: "none" }}
                        >
                          <FormItem className="flex flex-row items-center justify-center gap-2 w-full">
                            <FormControl>
                              <RadioGroupItem value={finding} className="cursor-pointer" />
                            </FormControl>
                            <FormLabel
                              htmlFor={finding}
                              className="font-normal text-center self-center text-sm select-none cursor-pointer"
                            >
                              {finding}
                            </FormLabel>
                          </FormItem>
                        </div>
                      ))}
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
                        of={MEDICAL_CLASSIFICATIONS}
                        render={(item) => (
                          <div key={item.value} className="w-full rounded-lg border p-3 flex items-center gap-3">
                            <FormItem className="flex items-center gap-3 w-full">
                              <FormControl>
                                <RadioGroupItem value={item.value} />
                              </FormControl>
                              <div className="flex flex-col w-full">
                                <FormLabel className="font-normal cursor-pointer">{item.label}</FormLabel>
                                <span className="text-xs text-muted-foreground mt-1">{item.description}</span>
                              </div>
                            </FormItem>
                          </div>
                        )}
                      />
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 mt-6">
              <input ref={closeBtnRef} type="hidden" value="ok" className="hidden" />
              <ActionButton type="submit" form="add-medical-certificate-form">
                Create
              </ActionButton>
            </div>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  )
}
