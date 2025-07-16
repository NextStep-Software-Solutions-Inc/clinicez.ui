"use client";

import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button";
import { Dialog, DialogTrigger } from "@components/ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@components/ui/input";
import { Checkbox } from "@components/ui/checkbox";
import { calculateAge } from "@/lib/utils";

const HEMATOLOGY = [
  "CBC (Complete Blood Count)",
  "Hemoglobin",
  "Hematocrit",
  "Platelet Count",
  "White Blood Cell Count",
  "Red Blood Cell Count",
  "ESR (Erythrocyte Sedimentation Rate)",
];
const CLINICAL_MICROSCOPY = [
  "Urinalysis",
  "Fecalysis",
  "Pregnancy Test",
  "Sperm Analysis",
  "Microscopic Examination",
];
const BLOOD_CHEMISTRY = [
  "Fasting Blood Sugar",
  "Random Blood Sugar",
  "Blood Urea Nitrogen (BUN)",
  "Creatinine",
  "Cholesterol",
  "Triglycerides",
  "SGPT",
  "SGOT",
  "Uric Acid",
  "Electrolytes",
];

const createLaboratoryRequestSchema = z.object({
  name: z.string().trim().min(3, { message: "Patient name must be at least 3 characters long" }),
  age: z.number().min(0, { message: "Age must be a positive number" }),
  address: z.string().trim().min(3, { message: "Address must be at least 3 characters long" }),
  hematology: z.array(z.string()).optional(),
  clinicalMicroscopy: z.array(z.string()).optional(),
  bloodChemistry: z.array(z.string()).optional(),
});

interface CreateLaboratoryRequestModalProps {
  clinicUid: string;
  onCreateLaboratoryRequest?: () => void;
  userInfo?: any;
}

export default function CreateLaboratoryRequestModal({ clinicUid, onCreateLaboratoryRequest, userInfo }: CreateLaboratoryRequestModalProps) {
  const closeBtnRef = React.useRef<HTMLInputElement>(null);

  // Autofill logic for defaultValues as per requested by design.
  const autofillDefaults = React.useMemo(() => {
    return {
      name:
        userInfo?.firstName && userInfo?.lastName
          ? `${userInfo.firstName} ${userInfo.lastName}`
          : "",
      age:
        userInfo?.dob
          ? calculateAge(userInfo?.dob) : 0,
      address: String(userInfo?.address || userInfo?.homeAddress || ""),
      hematology: [],
      clinicalMicroscopy: [],
      bloodChemistry: [],
    };
  }, [userInfo]);

  const form = useForm<z.infer<typeof createLaboratoryRequestSchema>>({
    resolver: zodResolver(createLaboratoryRequestSchema),
    defaultValues: autofillDefaults,
  });

  const action = async () => {
    form.handleSubmit(async (values) => {
      toast.promise(
        // Will be replaced soon with actual action. Need confirmation with sir Wave.
        Promise.resolve({ status: true, message: "Laboratory request created successfully" }),
        {
          loading: "Creating laboratory request...",
          success: (res) => {
            if (res.status) {
              onCreateLaboratoryRequest?.();
              closeBtnRef.current?.click();
            }
            return res.message;
          },
          error: (error) => error.message || "Failed to create laboratory request",
        }
      );
    })();
  };

  function getColumns(options: string[]) {
    return options.length > 6 ? "grid-cols-3" : "grid-cols-2";
  }

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                Create Laboratory Request
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent
        className="sm:max-w-[625px] overflow-scroll max-h-[80vh]"
        label="Create Laboratory Request"
        description="Fill in the patient information and select laboratory tests."
      >
        <Form {...form}>
          <form action={action} id="add-laboratory-request-form" className="space-y-6">
            {/* Patient Information Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-2">Patient Information</h3>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input id="name" placeholder="Juan Dela Cruz" {...field} />
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
                          type="number"
                          id="age"
                          placeholder="32"
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
                      <Input id="address" placeholder="123 Main Street, Quezon City, Metro Manila" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Laboratory Tests Section */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg mb-2">Laboratory Tests</h3>
              {/* HEMATOLOGY */}
              <FormField
                control={form.control}
                name="hematology"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HEMATOLOGY</FormLabel>
                    <FormControl>
                      <div className={`grid gap-2 ${getColumns(HEMATOLOGY)}`}>
                        {HEMATOLOGY.map((test) => (
                          <label key={test} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={field.value?.includes(test)}
                              onCheckedChange={(checked) => {
                                if (checked) field.onChange([...(field.value || []), test]);
                                else field.onChange((field.value || []).filter((t: string) => t !== test));
                              }}
                            />
                            <span className="text-sm">{test}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* CLINICAL MICROSCOPY */}
              <FormField
                control={form.control}
                name="clinicalMicroscopy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CLINICAL MICROSCOPY</FormLabel>
                    <FormControl>
                      <div className={`grid gap-2 ${getColumns(CLINICAL_MICROSCOPY)}`}>
                        {CLINICAL_MICROSCOPY.map((test) => (
                          <label key={test} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={field.value?.includes(test)}
                              onCheckedChange={(checked) => {
                                if (checked) field.onChange([...(field.value || []), test]);
                                else field.onChange((field.value || []).filter((t: string) => t !== test));
                              }}
                            />
                            <span className="text-sm">{test}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* BLOOD CHEMISTRY */}
              <FormField
                control={form.control}
                name="bloodChemistry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BLOOD CHEMISTRY</FormLabel>
                    <FormControl>
                      <div className={`grid gap-2 ${getColumns(BLOOD_CHEMISTRY)}`}>
                        {BLOOD_CHEMISTRY.map((test) => (
                          <label key={test} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={field.value?.includes(test)}
                              onCheckedChange={(checked) => {
                                if (checked) field.onChange([...(field.value || []), test]);
                                else field.onChange((field.value || []).filter((t: string) => t !== test));
                              }}
                            />
                            <span className="text-sm">{test}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <input ref={closeBtnRef} type="hidden" value="ok" className="hidden" />
              <Button type="submit" form="add-laboratory-request-form">
                Create Laboratory Request
              </Button>
            </div>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
