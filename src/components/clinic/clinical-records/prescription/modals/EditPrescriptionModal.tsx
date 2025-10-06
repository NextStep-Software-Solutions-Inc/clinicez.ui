"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnsavedChangesAlert } from "@/components/UnsavedChangesAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ActionButton from "@/components/ActionButton";
import Each from "@/components/utils/Each";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { updatePrescriptionAction } from "@/actions/clinics/clinical-record/prescription.action";
import { updateMedicineAction, createMedicineAction, deleteMedicineAction } from "@/actions/clinics/clinical-record/medicine.action";
import { GetPrescriptions } from "@/actions/clinics/clinical-record/prescription.action";
import { Plus, Pill, X } from "lucide-react";

const medicineSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Medicine name is required"),
  brandName: z.string().optional(),
  genericName: z.string().optional(),
  isGeneric: z.boolean().default(false),
  dosage: z.string({
    required_error: "Dosage is required",
  }).min(1, "Dosage cannot be empty"),
  qty: z
    .coerce
    .number()
    .min(1, "Quantity must be at least 1")
    .default(1),
  frequency: z.string().optional(),
  unit: z.string({
    required_error: "Unit is required",
  }).min(1, "Unit cannot be empty"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 day").default(1),
  notes: z.string({
    required_error: "Sig/Notes is required",
  }).min(1, "Sig/Notes cannot be empty"),
});

const formSchema = z.object({
  name: z
    .string()
    .optional()
    .transform((e) => (e === "" ? undefined : e)),
  remarks: z
    .string()
    .optional()
    .transform((e) => (e === "" ? undefined : e)),
  medicines: z.array(medicineSchema).default([]),
});

type FormData = z.infer<typeof formSchema>;
type MedicineForm = z.infer<typeof medicineSchema>;

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
];

interface EditPrescriptionModalProps {
  prescription: NonNullable<GetPrescriptions["data"]>[number];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  hpIds: number[];
}

export default function EditPrescriptionModal({
  prescription,
  open,
  onOpenChange,
  onUpdated,
  hpIds,
}: EditPrescriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [originalValues, setOriginalValues] = useState<FormData | null>(null);
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [editingMedicineIndex, setEditingMedicineIndex] = useState<number | null>(null);
  const [deletedMedicineIds, setDeletedMedicineIds] = useState<number[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      remarks: "",
      medicines: [],
    },
    mode: "onChange",
  });

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
  });

  const medicines = form.watch("medicines");

  const resetForm = useCallback(() => {
    form.reset({
      name: "",
      remarks: "",
      medicines: [],
    });
    setShowMedicineForm(false);
    setEditingMedicineIndex(null);
    setDeletedMedicineIds([]);
    medicineForm.reset();
  }, [form, medicineForm]);

  useEffect(() => {
    if (open && prescription) {
      const values: FormData = {
        name: prescription.name || "",
        remarks: prescription.remarks || "",
        medicines: prescription.Medicines?.map(medicine => ({
          id: medicine.id,
          name: medicine.name,
          brandName: medicine.brandName || "",
          genericName: medicine.genericName || "",
          isGeneric: medicine.isGeneric,
          dosage: medicine.dosage || "",
          qty: medicine.qty ?? 1,
          frequency: medicine.frequency || "",
          unit: medicine.unit || "",
          duration: medicine.duration,
          notes: medicine.notes || "",
        })) || [],
      };

      form.setValue("name", values.name);
      form.setValue("remarks", values.remarks);
      form.setValue("medicines", values.medicines);

      setOriginalValues(values);
      setDeletedMedicineIds([]);
    } else {
      resetForm();
    }
  }, [open, prescription, form, resetForm]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!originalValues) return false;
    const currentValues = form.getValues();
    return (
      currentValues.name !== originalValues.name ||
      currentValues.remarks !== originalValues.remarks ||
      JSON.stringify(currentValues.medicines) !== JSON.stringify(originalValues.medicines) ||
      deletedMedicineIds.length > 0 ||
      showMedicineForm
    );
  }, [form, originalValues, deletedMedicineIds, showMedicineForm]);

  const handleClose = useCallback((newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges()) {
      setShowAlert(true);
    } else {
      onOpenChange?.(newOpen);
    }
  }, [hasUnsavedChanges, onOpenChange]);

  const handleConfirmClose = useCallback(() => {
    setShowAlert(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  // Medicine form handlers
  const handleAddMedicine = () => {
    setShowMedicineForm(true);
    setEditingMedicineIndex(null);
    medicineForm.reset();
  };

  const handleEditMedicine = (index: number) => {
    const medicine = medicines[index];
    setEditingMedicineIndex(index);
    setShowMedicineForm(true);
    medicineForm.reset({ ...medicine, qty: medicine.qty ?? 1 });
  };

  const handleSaveMedicine = (data: MedicineForm) => {
    const currentMedicines = form.getValues("medicines") || [];

    if (editingMedicineIndex !== null) {
      // Edit existing medicine
      const updatedMedicines = [...currentMedicines];
      updatedMedicines[editingMedicineIndex] = data;
      form.setValue("medicines", updatedMedicines, { shouldDirty: true });
    } else {
      // Add new medicine
      form.setValue("medicines", [...currentMedicines, data], { shouldDirty: true });
    }

    setShowMedicineForm(false);
    setEditingMedicineIndex(null);
    medicineForm.reset();
    toast.success(editingMedicineIndex !== null ? "Medicine updated!" : "Medicine added!");
  };

  const handleCancelMedicine = () => {
    setShowMedicineForm(false);
    setEditingMedicineIndex(null);
    medicineForm.reset();
  };

  const handleRemoveMedicine = (index: number) => {
    const currentMedicines = form.getValues("medicines") || [];
    const medicine = currentMedicines[index];

    // If medicine has an ID, track it for deletion
    if (medicine.id) {
      setDeletedMedicineIds(prev => [...prev, medicine.id!]);
    }

    const updatedMedicines = currentMedicines.filter((_, i) => i !== index);
    form.setValue("medicines", updatedMedicines, { shouldDirty: true });
    toast.success("Medicine removed!");
  };

  const onSubmit = useCallback((data: FormData) => {
    setIsLoading(true);

    const updatePrescription = async () => {
      const prescriptionResult = await promiseWrapper(updatePrescriptionAction)({
        id: prescription.id,
        name: data.name,
        remarks: data.remarks,
        hpIds,
      });

      for (const medicineId of deletedMedicineIds) {
        await promiseWrapper(deleteMedicineAction)({ medicineId });
      }

      for (const medicine of data.medicines) {
        if (medicine.id) {
          await promiseWrapper(updateMedicineAction)({
            id: medicine.id,
            name: medicine.name,
            brandName: medicine.brandName,
            genericName: medicine.genericName,
            isGeneric: medicine.isGeneric,
            dosage: medicine.dosage,
            qty: medicine.qty,
            frequency: medicine.frequency,
            unit: medicine.unit,
            duration: medicine.duration,
            notes: medicine.notes,
          });
        } else {
          await promiseWrapper(createMedicineAction)({
            name: medicine.name,
            brandName: medicine.brandName,
            genericName: medicine.genericName,
            isGeneric: medicine.isGeneric,
            dosage: medicine.dosage,
            qty: medicine.qty,
            frequency: medicine.frequency,
            unit: medicine.unit,
            duration: medicine.duration,
            notes: medicine.notes,
            prescriptionId: prescription.id,
          });
        }
      }

      return prescriptionResult.message || "Prescription updated successfully!";
    };

    toast.promise(updatePrescription(), {
      loading: "Updating prescription...",
      success: (message) => {
        onUpdated?.();
        onOpenChange(false);
        return message;
      },
      error: (error) => {
        if (typeof error === "string") return error;
        if (error instanceof Error && error.message) return error.message;
        return "Failed to update prescription";
      },
      finally: () => {
        setIsLoading(false);
      },
    });
  }, [prescription.id, hpIds, deletedMedicineIds, onUpdated, onOpenChange]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Prescription</DialogTitle>
            <DialogDescription>
              Update the prescription details and medicines.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <p className="text-sm text-gray-500">Manage medicines for this prescription</p>
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
                                <FormLabel>
                                  Medicine Name <span className="text-red-500 font-bold">*</span>
                                </FormLabel>
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
                        <AccordionItem key={medicine.id || index} value={`medicine-${index}`}>
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
                  className="bg-black text-white hover:bg-black/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Prescription"}
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
  );
}
