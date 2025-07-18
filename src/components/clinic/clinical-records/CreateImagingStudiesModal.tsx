"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown } from "lucide-react";
import { calculateAge, capitalize } from "@/lib/utils";
import ActionButton from "@/components/ActionButton";
import { PatientProfile } from "./CreateMedicalCertificateModal";
import { createImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { self } from "@/services/request";

const GENDERS = [
  "MALE",
  "FEMALE",
];


type ImagingDiagnostic = {
  id: number;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
};

function useImagingDiagnostics() {
  const [diagnostics, setDiagnostics] = React.useState<ImagingDiagnostic[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchDiagnostics() {
      setLoading(true);
      try {
        const result = await self.get<{ message: string; data: any[]; status: boolean }>('/api/diagnostics/imaging');

        if (isMounted && result.status && result.data) {
          const mappedDiagnostics = result.data.map((diag: any) => ({
            id: diag.id,
            name: diag.name,
            description: diag.description ?? undefined,
            category: diag.category ?? undefined,
            isActive: !!diag.isActive,
          }));
          setDiagnostics(mappedDiagnostics);
        } else if (isMounted) {
          setDiagnostics([]);
        }
      } catch (error) {
        if (isMounted) setDiagnostics([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDiagnostics();
    return () => { isMounted = false; };
  }, []);

  return { diagnostics, loading };
}

interface MultiSelectProps {
  options: ImagingDiagnostic[];
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

function MultiSelect({ options, value, onChange, placeholder = "Select options...", disabled = false }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOptions = options.filter(option => value.includes(option.id));

  const handleSelect = (optionId: number) => {
    const newValue = value.includes(optionId)
      ? value.filter(id => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  const handleRemove = (optionId: number) => {
    onChange(value.filter(id => id !== optionId));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[40px] h-auto"
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedOptions.map((option) => (
                <Badge
                  key={option.id}
                  variant="secondary"
                  className="text-xs"
                >
                  {option.name}
                  <button
                    className="ml-1 hover:bg-muted rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(option.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search diagnostics..." />
          <CommandList>
            <CommandEmpty>No diagnostic found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => handleSelect(option.id)}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={value.includes(option.id)}
                    className="mr-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{option.name}</div>
                    {option.description && (
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
  const closeBtnRef = React.useRef<HTMLInputElement>(null);
  const { diagnostics, loading } = useImagingDiagnostics();

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

  React.useEffect(() => {
    if (open) {
      form.reset(autofillDefaults);
    }
  }, [open, autofillDefaults, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!patientId || !hpId) {
      toast.error("Missing required patient or healthcare provider information.");
      return;
    }

    try {
      const result = await createImagingStudyAction({
        clinicUid,
        patientId,
        hpId,
        history: values.history || undefined,
        reason: values.reason || undefined,
        impression: values.impression || undefined,
        status: "PENDING",
        diagnosticIds: values.diagnostics,
        consultationTicketId: consultationTicketId || undefined,
      });

      if (result.status) {
        toast.success(result.message);
        onCreateImagingStudy?.();
        setOpen(false);
        form.reset(autofillDefaults);
      } else {
        toast.error(result.message || "Failed to create imaging study");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create imaging study");
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Form {...form}>
        <form onSubmit={handleSubmit} id="add-imaging-study-form">
          <DialogTrigger asChild>
            <Button size="sm" className="w-full" onClick={() => setOpen(true)}>
              Create Imaging Study
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
              <ActionButton type="submit" form="add-imaging-study-form" className="bg-black text-white hover:bg-black/90">
                Save changes
              </ActionButton>
            </DialogFooter>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  )
};