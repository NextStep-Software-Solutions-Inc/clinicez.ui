"use client";

import { createImagingStudiesAction } from "@/actions/clinics/clinic.action";
import CustomModalContent from "@/components/CustomModalContent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDiagnostics } from "@/hooks/useDiagnostics";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GENDERS = [
  "Male",
  "Female",
];

const createImagingStudiesSchema = z.object({
  name: z.string({
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
  gender: z.enum(["Male", "Female"], {
    required_error: "Please select the patient's gender",
  }),
  diagnostics: z.coerce.number({
    required_error: "Please provide the diagnostics",
  }).min(1, {
    message: "Diagnostics must be at least 1",
  }),
  history: z.string().trim().min(3, {
    message: "Medical history must be at least 3 characters long",
  }).optional(),
  impression: z.string().trim().min(3, {
    message: "Impression must be at least 3 characters long",
  }).optional(),
  requestFor: z.string().trim().min(3, {
    message: "Request for must be at least 3 characters long",
  }).optional(),
});

interface CreateImagingStudiesModalProps {
  clinicUid: string;
  onCreateImagingStudy?: () => void;
  userInfo?: any;
}

const DIAGNOSTICS_THRESHOLD = 3;

export default function CreateImagingStudiesModal({ clinicUid, onCreateImagingStudy, userInfo }: CreateImagingStudiesModalProps) {
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
          ? Math.max(0, Math.floor((Date.now() - new Date(userInfo.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
          : 0,
      address: String(userInfo?.address || userInfo?.homeAddress || ""),
      birthdate: userInfo?.dob ? new Date(userInfo.dob) : new Date(),
      gender: userInfo?.gender === "Male" || userInfo?.gender === "Female" ? userInfo.gender : undefined,
      diagnostics: 1,
      history: "",
      impression: "",
      requestFor: "",
    };
  }, [userInfo]);

  const { diagnostics } = useDiagnostics(); // This is still mock. Will be replaced with actual diagnostics data when implemented.

  const form = useForm<z.infer<typeof createImagingStudiesSchema>>({
    resolver: zodResolver(createImagingStudiesSchema),
    defaultValues: autofillDefaults,
  });

  useEffect(() => {
    form.setValue("diagnostics", diagnostics?.[0]?.id);
  }, [diagnostics, form]);

  const action = async () => {
    form.handleSubmit(async (values) => {
      toast.promise(
        createImagingStudiesAction({
          ...values,
          clinicUid,
        }),
        {
          loading: "Creating imaging study...",
          success: (res) => {
            if (res.status) {
              onCreateImagingStudy?.()
              closeBtnRef.current?.click()
            }
            return res.message
          },
          error: (error) => error.message || "Failed to create imaging study",
        },
      )
    })()
  };

  // 3 diagnostics fallback logic FOR NOW
  const diagnosticsList = React.useMemo(() => (
    diagnostics && diagnostics.length >= DIAGNOSTICS_THRESHOLD
      ? diagnostics
      : [
        { id: 1, name: "Chest X-Ray" },
        { id: 2, name: "Abdominal Ultrasound" },
        { id: 3, name: "CT Scan" }
      ]
  ), [diagnostics]);

  // Default to first diagnostic if available (this is a mock setup) ~ Kyle 
  React.useEffect(() => {
    if (diagnosticsList.length > 0) {
      form.setValue("diagnostics", diagnosticsList[0].id);
    }
  }, [diagnosticsList, form]);

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                Create Imaging Study
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent
        className="sm:max-w-[625px] overflow-scroll max-h-[80vh]"
        label="Create Imaging Studies Request"
        description="Fill in the patient information and imaging study details."
      >
        <Form {...form}>
          <form action={action} id="add-imaging-study-form" className="space-y-6">
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
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Birthdate</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          id="birthdate"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={e => field.onChange(new Date(e.target.value))}
                          max={new Date().toISOString().split('T')[0]}
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
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row gap-6"
                        >
                          {GENDERS.map((gender) => (
                            <div key={gender} className="flex items-center gap-2">
                              <RadioGroupItem value={gender} className="cursor-pointer" />
                              <FormLabel htmlFor={gender} className="font-normal text-sm select-none cursor-pointer">
                                {gender}
                              </FormLabel>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Imaging Studies Request Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-2">Imaging Studies Request</h3>
              <FormField
                control={form.control}
                name="diagnostics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnostics</FormLabel>
                    <Select
                      onValueChange={val => field.onChange(Number(val))}
                      name={field.name}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger id="diagnostics">
                          <SelectValue placeholder="Select a diagnostic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {diagnosticsList.map((diag) => (
                          <SelectItem key={diag.id} value={String(diag.id)}>
                            {diag.name || diag.label || diag.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="history"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>History</FormLabel>
                    <FormControl>
                      <textarea id="history" placeholder="Medical history..." className="w-full min-h-[80px] border rounded-md p-2 text-sm" {...field} />
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
                    <FormLabel>Impression</FormLabel>
                    <FormControl>
                      <textarea id="impression" placeholder="Impression..." className="w-full min-h-[80px] border rounded-md p-2 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requestFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request For</FormLabel>
                    <FormControl>
                      <textarea id="requestFor" placeholder="Request for..." className="w-full min-h-[80px] border rounded-md p-2 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <input ref={closeBtnRef} type="hidden" value="ok" className="hidden" />
              <Button type="submit" form="add-imaging-study-form">
                Create
              </Button>
            </div>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
};