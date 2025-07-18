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
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { useState, useTransition, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { createLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { Checkbox } from "@components/ui/checkbox";
import { useLaboratoryDiagnostics } from "@/hooks/use-laboratory-diagnostics";
import { calculateAge } from "@/lib/utils";
import Each from "@components/utils/Each";

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
  address: z.string({
    required_error: "Please provide the patient's address",
  }).trim().min(3, {
    message: "Address must be at least 3 characters long",
  }),
  impression: z.string().optional(),
  status: z.string().default("PENDING"),
  diagnosticIds: z.array(z.number()).min(1, "Please select at least one diagnostic test"),
});

type FormData = z.infer<typeof formSchema>;

export interface PatientProfile {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  dob?: string;
  gender?: string;
  address?: {
    homeAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

interface CreateLaboratoryRequestModalProps {
  clinicUid: string;
  patientId?: number;
  hpId?: number;
  onCreated?: () => void;
  userInfo: PatientProfile | null;
  consultationTicketId?: number;
}

export default function CreateLaboratoryRequestModal({
  clinicUid,
  patientId,
  hpId,
  onCreated,
  userInfo,
  consultationTicketId,
}: CreateLaboratoryRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { data: diagnosticsData, isLoading: diagnosticsLoading } = useLaboratoryDiagnostics();

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
      age: userInfo?.dob ? calculateAge(userInfo.dob) : 0,
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
      status: "PENDING",
      diagnosticIds: [] as number[],
    };
  }, [userInfo]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: autofillDefaults,
  });

  useEffect(() => {
    if (open) {
      form.reset(autofillDefaults);
    }
  }, [open, autofillDefaults, form]);

  const handleSubmit = (data: FormData) => {
    if (!patientId || !hpId) {
      toast.error("Missing required patient or healthcare provider information.");
      return;
    }

    startTransition(() => {
      toast.promise(
        promiseWrapper(createLaboratoryRequestAction)({
          clinicUid,
          patientId,
          hpId,
          consultationTicketId,
          ...data,
        }),
        {
          loading: "Creating laboratory request...",
          success: (response) => {
            form.reset(autofillDefaults);
            setOpen(false);
            onCreated?.();
            return response.message;
          },
          error: (error) => error,
        }
      );
    });
  };

  const diagnostics = useMemo(() => diagnosticsData?.data || [], [diagnosticsData?.data]);

  // Group diagnostics by category
  const groupedDiagnostics = useMemo(() => {
    const groups: Record<string, typeof diagnostics> = {};

    diagnostics.forEach((diagnostic) => {
      const category = diagnostic.category || 'UNCATEGORIZED';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(diagnostic);
    });

    return groups;
  }, [diagnostics]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Laboratory Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Laboratory Request</DialogTitle>
          <DialogDescription>
            Create a new laboratory request for the patient.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              name="diagnosticIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Laboratory Tests</FormLabel>
                  <FormControl>
                    <div className="space-y-6">
                      {Object.keys(groupedDiagnostics).length > 0 ? (
                        Object.entries(groupedDiagnostics).map(([category, categoryDiagnostics]) => {
                          // Dynamic column calculation based on number of items
                          let gridCols = "grid-cols-1"; // Default: 1 column
                          if (categoryDiagnostics.length >= 10) {
                            gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"; // 3 columns for 10+ items
                          } else if (categoryDiagnostics.length >= 6) {
                            gridCols = "grid-cols-1 md:grid-cols-2"; // 2 columns for 6-9 items
                          }

                          return (
                            <div key={category} className="space-y-3">
                              <h4 className="font-semibold text-sm text-primary uppercase tracking-wide">
                                {category}
                              </h4>
                              <div className={`grid ${gridCols} gap-3`}>
                                <Each
                                  of={categoryDiagnostics}
                                  render={(diagnostic) => (
                                    <div
                                      key={diagnostic.id}
                                      className="w-full rounded-lg border p-3 flex items-center gap-2"
                                      tabIndex={-1}
                                      style={{ outline: "none" }}
                                    >
                                      <Checkbox
                                        checked={field.value.includes(diagnostic.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...field.value, diagnostic.id]);
                                          } else {
                                            field.onChange(field.value.filter(id => id !== diagnostic.id));
                                          }
                                        }}
                                        className="cursor-pointer"
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-normal text-xs select-none">{diagnostic.name}</span>
                                        {diagnostic.description && (
                                          <span className="text-[10px] text-muted-foreground">{diagnostic.description}</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <span className="text-sm text-muted-foreground">
                            {diagnosticsLoading ? "Loading diagnostics..." : "No laboratory tests available"}
                          </span>
                        </div>
                      )}
                    </div>
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
                    <Textarea
                      placeholder="Enter impression or reason for laboratory tests..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending || diagnosticsLoading}>
                {isPending ? "Creating..." : "Create Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}