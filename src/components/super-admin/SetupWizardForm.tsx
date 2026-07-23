"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { SuperAdminUserSearchCombobox } from "./SuperAdminUserSearchCombobox";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useToast } from "@components/ui/use-toast";
import { setupTenantWizardAction } from "@actions/super-admin/setup-wizard.action";
import { Check, ChevronRight, Loader2, Play } from "lucide-react";

const WIZARD_STORAGE_KEY = "clinicez_setup_wizard_state";

type WizardFormData = {
  tenantUid: string;
  tenantName: string;
  tenantDescription: string;
  ownerEmail: string;
  orgUid: string;
  orgName: string;
  orgDescription: string;
  clinicUid: string;
  clinicName: string;
  clinicDescription: string;
};

const defaultValues: WizardFormData = {
  tenantUid: "",
  tenantName: "",
  tenantDescription: "",
  ownerEmail: "",
  orgUid: "",
  orgName: "",
  orgDescription: "",
  clinicUid: "",
  clinicName: "",
  clinicDescription: "",
};

export default function SetupWizardForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, reset, trigger, formState: { errors } } = useForm<WizardFormData>({
    defaultValues
  });

  // Load state from sessionStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedState = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (savedState) {
      try {
        const { step: savedStep, formData } = JSON.parse(savedState);
        if (savedStep) setStep(savedStep);
        if (formData) reset(formData);
      } catch (e) {
        console.error("Failed to parse wizard state", e);
      }
    }
  }, [reset]);

  // Save state whenever it changes
  const formData = watch();
  useEffect(() => {
    if (isMounted) {
      sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ step, formData }));
    }
  }, [step, formData, isMounted]);

  const handleNext = async (fieldsToValidate: (keyof WizardFormData)[]) => {
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmit = async (data: WizardFormData) => {
    setIsSubmitting(true);
    try {
      const res = await setupTenantWizardAction(data);
      if (res.success) {
        toast({
          title: "Setup Complete",
          description: "Tenant, Organization, and Clinic created successfully.",
        });
        sessionStorage.removeItem(WIZARD_STORAGE_KEY);
        router.push("/super-admin/tenants");
        router.refresh();
      } else {
        toast({
          title: "Setup Failed",
          description: res.error,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null; // Prevent hydration mismatch

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: "Tenant" },
          { num: 2, label: "Organization" },
          { num: 3, label: "Clinic" },
          { num: 4, label: "Review" },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex flex-col items-center ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold mb-2 ${
                step > s.num ? "bg-primary border-primary text-primary-foreground" :
                step === s.num ? "border-primary" : "border-muted-foreground"
              }`}>
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span className="text-sm font-medium">{s.label}</span>
            </div>
            {idx < 3 && (
              <div className={`w-16 h-1 mx-4 rounded ${step > s.num ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Tenant */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Tenant Details</CardTitle>
              <CardDescription>Enter the details for the new tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantUid">Tenant UID <span className="text-destructive">*</span></Label>
                <Input id="tenantUid" placeholder="e.g. tnt_12345" {...register("tenantUid", { required: "Tenant UID is required" })} />
                {errors.tenantUid && <p className="text-sm text-destructive">{errors.tenantUid.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantName">Tenant Name <span className="text-destructive">*</span></Label>
                <Input id="tenantName" placeholder="e.g. Acme Healthcare" {...register("tenantName", { required: "Tenant Name is required" })} />
                {errors.tenantName && <p className="text-sm text-destructive">{errors.tenantName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantDescription">Description</Label>
                <Input id="tenantDescription" placeholder="Optional description" {...register("tenantDescription")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Owner Email <span className="text-destructive">*</span></Label>
                <Controller
                  control={control}
                  name="ownerEmail"
                  rules={{ required: "Owner Email is required" }}
                  render={({ field }) => (
                    <SuperAdminUserSearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search for an owner..."
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">This user must already exist in the system and will be assigned as the owner/admin.</p>
                {errors.ownerEmail && <p className="text-sm text-destructive">{errors.ownerEmail.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="button" onClick={() => handleNext(["tenantUid", "tenantName", "ownerEmail"])}>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Organization */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Enter the details for the organization under this tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgUid">Organization UID <span className="text-destructive">*</span></Label>
                <Input id="orgUid" placeholder="e.g. org_12345" {...register("orgUid", { required: "Organization UID is required" })} />
                {errors.orgUid && <p className="text-sm text-destructive">{errors.orgUid.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name <span className="text-destructive">*</span></Label>
                <Input id="orgName" placeholder="e.g. Acme Main Branch" {...register("orgName", { required: "Organization Name is required" })} />
                {errors.orgName && <p className="text-sm text-destructive">{errors.orgName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgDescription">Description</Label>
                <Input id="orgDescription" placeholder="Optional description" {...register("orgDescription")} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
              <Button type="button" onClick={() => handleNext(["orgUid", "orgName"])}>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Clinic */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Clinic Details</CardTitle>
              <CardDescription>Enter the details for the initial clinic.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinicUid">Clinic UID <span className="text-destructive">*</span></Label>
                <Input id="clinicUid" placeholder="e.g. cln_12345" {...register("clinicUid", { required: "Clinic UID is required" })} />
                {errors.clinicUid && <p className="text-sm text-destructive">{errors.clinicUid.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name <span className="text-destructive">*</span></Label>
                <Input id="clinicName" placeholder="e.g. Acme Downtown Clinic" {...register("clinicName", { required: "Clinic Name is required" })} />
                {errors.clinicName && <p className="text-sm text-destructive">{errors.clinicName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicDescription">Description</Label>
                <Input id="clinicDescription" placeholder="Optional description" {...register("clinicDescription")} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
              <Button type="button" onClick={() => handleNext(["clinicUid", "clinicName"])}>
                Review <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Please review the details before creating the entities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg border-b pb-1">Tenant</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">UID:</span> <span className="font-medium">{formData.tenantUid}</span>
                  <span className="text-muted-foreground">Name:</span> <span className="font-medium">{formData.tenantName}</span>
                  <span className="text-muted-foreground">Description:</span> <span>{formData.tenantDescription || "-"}</span>
                  <span className="text-muted-foreground">Owner Email:</span> <span className="font-medium">{formData.ownerEmail}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg border-b pb-1">Organization</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">UID:</span> <span className="font-medium">{formData.orgUid}</span>
                  <span className="text-muted-foreground">Name:</span> <span className="font-medium">{formData.orgName}</span>
                  <span className="text-muted-foreground">Description:</span> <span>{formData.orgDescription || "-"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg border-b pb-1">Clinic</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">UID:</span> <span className="font-medium">{formData.clinicUid}</span>
                  <span className="text-muted-foreground">Name:</span> <span className="font-medium">{formData.clinicName}</span>
                  <span className="text-muted-foreground">Description:</span> <span>{formData.clinicDescription || "-"}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>Back</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Confirm & Create
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}
