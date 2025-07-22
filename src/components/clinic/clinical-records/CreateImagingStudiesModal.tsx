"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { calculateAge, capitalize } from "@/lib/utils";
import ActionButton from "@/components/ActionButton";
import { createImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import MultiSelect from "@/components/MultiSelect";
import { useImagingDiagnostics } from "@/hooks/useImagingDiagnostics";
import { PatientProfile } from "@/components/consultation/ConsultationDetails";
import { Plus } from "lucide-react";
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
  hpId?: number;
  consultationTicketId?: number;
}

export default function CreateImagingStudiesModal({ clinicUid, onCreateImagingStudy, userInfo, patientId, hpId, consultationTicketId }: CreateImagingStudiesModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  React.useEffect(() => {
    if (open) {
      resetFormWithDefaults();
    }
  }, [open, resetFormWithDefaults]);

  const action = useCallback(async (values: z.infer<typeof createImagingStudiesSchema>) => {
    if (!patientId || !hpId) {
      toast.error("Missing required patient or healthcare provider information.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await promiseWrapper(createImagingStudyAction)({
        clinicUid,
        patientId,
        hpId,
        consultationTicketId,
        diagnosticIds: values.diagnostics,
        ...values,
      });

      toast.success("Imaging study request created successfully.");
      setOpen(false);
      resetFormWithDefaults();
      onCreateImagingStudy?.();
    } catch (error) {
      toast.error("Failed to create imaging study request.");
    } finally {
      setIsSubmitting(false);
    }
  }, [patientId, hpId, clinicUid, consultationTicketId, resetFormWithDefaults, onCreateImagingStudy]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birthdate</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          id="birthdate"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={e => field.onChange(new Date(e.target.value))}
                          max={new Date().toISOString().split('T')[0]}
                          disabled
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
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row gap-6"
                          disabled
                        >
                          {GENDERS.map((gender) => (
                            <div key={gender} className="flex items-center gap-2">
                              <RadioGroupItem value={gender} className="cursor-pointer" />
                              <FormLabel htmlFor={gender} className="font-normal text-sm select-none cursor-pointer">
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
              <FormField
                control={form.control}
                name="diagnostics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnostics</FormLabel>
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
                    <FormLabel>History</FormLabel>
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
                    <FormLabel>Impression</FormLabel>
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
                    <FormLabel>Reason</FormLabel>
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
  );
}