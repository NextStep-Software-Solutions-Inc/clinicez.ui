"use client"

import ActionButton from "@/components/ActionButton"
import { PatientProfile } from "@/components/consultation/ConsultationDetails"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { UnsavedChangesAlert } from "@/components/UnsavedChangesAlert"
import { calculateAge, cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Pill, User, ChevronDown, ChevronUp, X } from "lucide-react"
import React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { promiseWrapper } from "@/lib/with-error-handling"
import { createPrescriptionAction } from "@/actions/clinics/clinical-record/prescription.action"
import { createMedicineAction } from "@/actions/clinics/clinical-record/medicine.action"
import Each from "@/components/utils/Each"

interface CreatePrescriptionModalProps {
  clinicUid: string
  patientId?: number
  consultationTicketId: number
  userInfo: PatientProfile | null
  hpIds?: number[]
  onCreated?: () => void
}

const medicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  brandName: z.string().optional(),
  genericName: z.string().optional(),
  isGeneric: z.boolean().default(false),
  dosage: z.string({
    required_error: "Dosage is required",
  }),
  qty: z.coerce.number().min(1, "Quantity must be at least 1").default(1),
  frequency: z.string().optional(),
  unit: z.string({
    required_error: "Unit is required",
  }),
  duration: z.coerce.number().min(1, "Duration must be at least 1 day").default(1),
  notes: z.string({
    required_error: "Sig/Notes is required",
  }),
})

const createPrescriptionSchema = z.object({
  patientName: z.string({
    required_error: "Patient name is required",
    invalid_type_error: "Patient name must be a string",
  }),
  age: z
    .number({
      required_error: "Age is required",
      invalid_type_error: "Age must be a number",
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
    .optional()
    .transform((e) => (e === "" ? undefined : e)),
  name: z
    .string()
    .optional()
    .transform((e) => (e === "" ? undefined : e)),
  remarks: z
    .string()
    .optional()
    .transform((e) => (e === "" ? undefined : e)),
  medicines: z.array(medicineSchema).default([]),
})

type CreatePrescriptionForm = z.infer<typeof createPrescriptionSchema>
type MedicineForm = z.infer<typeof medicineSchema>

const unitOptions = [
  { value: "tablets", label: "Tablets" },
  { value: "capsules", label: "Capsules" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "mg", label: "Milligrams (mg)" },
  { value: "g", label: "Grams (g)" },
  { value: "drops", label: "Drops" },
  { value: "sachets", label: "Sachets" },
  { value: "vials", label: "Vials" },
  { value: "patches", label: "Patches" },
  { value: "syringes", label: "Syringes" },
  { value: "bottles", label: "Bottles" },
  { value: "tubes", label: "Tubes" },
]

export default function CreatePrescriptionModal({
  clinicUid,
  patientId,
  consultationTicketId,
  userInfo,
  hpIds = [],
  onCreated,
}: CreatePrescriptionModalProps) {
  const [open, setOpen] = React.useState(false)
  const [showAlert, setShowAlert] = React.useState(false)
  const [showPatientInfo, setShowPatientInfo] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showMedicineForm, setShowMedicineForm] = React.useState(false)
  const [editingMedicineIndex, setEditingMedicineIndex] = React.useState<number | null>(null)

  const autofillDefaults = React.useMemo(() => {
    return {
      patientName: [
        userInfo?.firstName || "",
        userInfo?.middleName || "",
        userInfo?.lastName || "",
        userInfo?.suffix ? `, ${userInfo.suffix}` : "",
      ]
        .filter(Boolean)
        .join(" "),
      age: userInfo?.dob ? calculateAge(userInfo.dob) : 0,
      dob: userInfo?.dob ? new Date(userInfo.dob) : undefined,
      gender: (userInfo?.gender === "MALE" || userInfo?.gender === "FEMALE") ? userInfo.gender as "MALE" | "FEMALE" : undefined,
      address: [
        userInfo?.address?.homeAddress || "",
        userInfo?.address?.city || "",
        userInfo?.address?.state || "",
        userInfo?.address?.country || "",
        userInfo?.address?.zipCode || "",
      ]
        .filter(Boolean)
        .join(", "),
      name: "",
      remarks: "",
      medicines: [] as MedicineForm[],
    }
  }, [userInfo])

  const form = useForm<CreatePrescriptionForm>({
    resolver: zodResolver(createPrescriptionSchema),
    defaultValues: autofillDefaults,
  })

  const medicineForm = useForm<MedicineForm>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: "",
      brandName: "",
      genericName: "",
      isGeneric: false,
      dosage: "",
      qty: 1,
      frequency: "",
      unit: "",
      duration: 1,
      notes: "",
    },
  })

  const {
    handleSubmit,
    getValues,
    reset,
    watch,
    setValue,
    formState: { isSubmitting: formIsSubmitting, errors, dirtyFields },
  } = form

  const medicines = watch("medicines")

  const resetFormWithDefaults = React.useCallback(() => {
    reset(autofillDefaults)
    setShowMedicineForm(false)
    setEditingMedicineIndex(null)
    medicineForm.reset()
  }, [reset, autofillDefaults, medicineForm])

  const hasUnsavedChanges = React.useCallback(() => {
    return !!(dirtyFields.name || dirtyFields.remarks || medicines.length > 0 || showMedicineForm)
  }, [dirtyFields, medicines, showMedicineForm])

  // Trigger the alert dialog when the form has unsaved changes
  const handleModalChange = React.useCallback(
    (newOpen: boolean) => {
      if (!newOpen && hasUnsavedChanges()) {
        setShowAlert(true)
      } else {
        setOpen(newOpen) // Set open state directly
        if (!newOpen) {
          resetFormWithDefaults()
        }
      }
    },
    [hasUnsavedChanges, resetFormWithDefaults],
  )

  // When form is closed, the user confirms, reset the form and close the modal
  const handleConfirmClose = React.useCallback(() => {
    setShowAlert(false)
    setOpen(false)
    resetFormWithDefaults()
  }, [resetFormWithDefaults])

  React.useEffect(() => {
    if (open) {
      resetFormWithDefaults()
    }
  }, [open, resetFormWithDefaults])

  // Medicine form handlers
  const handleAddMedicine = () => {
    setShowMedicineForm(true)
    setEditingMedicineIndex(null)
    medicineForm.reset()
  }

  const handleEditMedicine = (index: number) => {
    const medicine = medicines[index]
    setEditingMedicineIndex(index)
    setShowMedicineForm(true)
    medicineForm.reset(medicine)
  }

  const handleSaveMedicine = (data: MedicineForm) => {
    const currentMedicines = getValues("medicines") || []

    if (editingMedicineIndex !== null) {
      // Edit existing medicine
      const updatedMedicines = [...currentMedicines]
      updatedMedicines[editingMedicineIndex] = data
      setValue("medicines", updatedMedicines, { shouldDirty: true })
    } else {
      // Add new medicine
      setValue("medicines", [...currentMedicines, data], { shouldDirty: true })
    }

    setShowMedicineForm(false)
    setEditingMedicineIndex(null)
    medicineForm.reset()
    toast.success(editingMedicineIndex !== null ? "Medicine updated!" : "Medicine added!")
  }

  const handleCancelMedicine = () => {
    setShowMedicineForm(false)
    setEditingMedicineIndex(null)
    medicineForm.reset()
  }

  const handleRemoveMedicine = (index: number) => {
    const currentMedicines = getValues("medicines") || []
    const updatedMedicines = currentMedicines.filter((_, i) => i !== index)
    setValue("medicines", updatedMedicines, { shouldDirty: true })
    toast.success("Medicine removed!")
  }

  // Main form submission
  const action = React.useCallback(
    async (data: CreatePrescriptionForm) => {
      if (!patientId) {
        toast.error("Patient ID is required")
        return
      }

      setIsSubmitting(true)

      toast.promise(
        promiseWrapper(createPrescriptionAction)({
          name: data.name,
          remarks: data.remarks,
          consultationTicketId,
          patientId,
          clinicUid,
          hpIds,
          isArchived: false,
        }).then(async (prescriptionResult) => {
          // Create medicines if any
          if (data.medicines.length > 0 && prescriptionResult.data?.id) {
            const medicinePromises = data.medicines.map(medicine =>
              promiseWrapper(createMedicineAction)({
                ...medicine,
                prescriptionId: prescriptionResult.data!.id,
              })
            )
            await Promise.all(medicinePromises)
          }
          return prescriptionResult
        }),
        {
          loading: "Creating prescription...",
          success: (result) => {
            setIsSubmitting(false)
            setOpen(false)
            resetFormWithDefaults()
            onCreated?.()
            return result.message || "Prescription created successfully!"
          },
          error: (error) => {
            setIsSubmitting(false)
            return error as string
          },
        }
      )
    },
    [patientId, consultationTicketId, clinicUid, hpIds, onCreated, resetFormWithDefaults],
  )

  return (
    <>
      <Dialog open={open} onOpenChange={handleModalChange}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Prescription
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Prescription</DialogTitle>
            <DialogDescription>Fill in the details to create a new prescription.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={handleSubmit(action)}
              id="create-prescription-form"
              className="space-y-6"
            >
              {/* Patient Profile Section */}
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
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            {userInfo?.gender ? (userInfo.gender === 'MALE' ? 'Male' : 'Female') : 'N/A'}
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
                    {/* Patient Demographics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                      <FormField
                        control={form.control}
                        name="patientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600">Full Name</FormLabel>
                            <FormControl>
                              <Input
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
                        name="dob"
                        render={({ field }) => (
                          <FormItem>
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
                          <FormItem>
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

                    {/* Age and Address Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600">Age</FormLabel>
                            <FormControl>
                              <Input
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

                      <div className="md:col-span-3">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600">Address</FormLabel>
                              <FormControl>
                                <Input
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
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Prescription Details */}
              <div className="space-y-4">
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter prescription name"
                          className="focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </FormControl>
                      <FormDescription>Name of the prescription or treatment. (Optional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="remarks"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter additional notes"
                          className="resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </FormControl>
                      <FormDescription>Additional notes or instructions for the prescription. (Optional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Medicines Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Medicines</h3>
                    <p className="text-sm text-gray-500">Add medicines to this prescription</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMedicine}
                    className="gap-2"
                    disabled={showMedicineForm}
                  >
                    <Plus className="h-4 w-4" />
                    Add Medicine
                  </Button>
                </div>

                {/* Medicine Form */}
                {showMedicineForm && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm">
                        {editingMedicineIndex !== null ? "Edit Medicine" : "Add Medicine"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Form {...medicineForm}>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={medicineForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Medicine Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter medicine name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={medicineForm.control}
                            name="isGeneric"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Generic Medicine
                                  </FormLabel>
                                  <FormDescription>
                                    Check if this is a generic medicine
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={medicineForm.control}
                            name="brandName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Brand Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter brand name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={medicineForm.control}
                            name="genericName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Generic Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter generic name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={medicineForm.control}
                            name="dosage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Dosage <span className="text-red-500 font-bold">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., 500" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={medicineForm.control}
                            name="qty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Quantity <span className="text-red-500 font-bold">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={field.value?.toString() ?? ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder="e.g., 30"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={medicineForm.control}
                            name="frequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., 3 times daily" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={medicineForm.control}
                            name="unit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Unit <span className="text-red-500 font-bold">*</span>
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <Each
                                      of={unitOptions}
                                      render={(option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      )}
                                    />
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={medicineForm.control}
                            name="duration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duration (days)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={field.value?.toString() ?? ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder="7"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={medicineForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Sig <span className="text-red-500 font-bold">*</span>
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Signature - instructions for the patient"
                                  className="resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelMedicine}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={medicineForm.handleSubmit(handleSaveMedicine)}
                          >
                            {editingMedicineIndex !== null ? "Update" : "Save"}
                          </Button>
                        </div>
                      </Form>
                    </CardContent>
                  </Card>
                )}

                {/* Medicines List */}
                {medicines.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <Each
                      of={medicines}
                      render={(medicine, index) => (
                        <AccordionItem key={index} value={`medicine-${index}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">{medicine.name}</span>
                                {medicine.isGeneric && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    Generic
                                  </span>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <span className="text-sm font-medium text-gray-600">Dosage:</span>
                                <p className="text-sm">{medicine.dosage || "Not specified"}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Quantity:</span>
                                <p className="text-sm">{medicine.qty ?? "Not specified"}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Frequency:</span>
                                <p className="text-sm">{medicine.frequency || "Not specified"}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Duration:</span>
                                <p className="text-sm">{medicine.duration} day(s)</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Unit:</span>
                                <p className="text-sm">{medicine.unit || "Not specified"}</p>
                              </div>
                              {medicine.notes && (
                                <div className="col-span-2">
                                  <span className="text-sm font-medium text-gray-600">Sig:</span>
                                  <p className="text-sm">{medicine.notes}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMedicine(index)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveMedicine(index)}
                              >
                                <X className="h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    />
                  </Accordion>
                )}
              </div>

              <DialogFooter>
                <ActionButton
                  type="submit"
                  form="create-prescription-form"
                  className="bg-black text-white hover:bg-black/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save changes"}
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
  )
}
