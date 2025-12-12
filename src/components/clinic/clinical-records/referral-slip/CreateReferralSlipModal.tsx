"use client"

import { createReferralSlipAction } from "@/actions/clinics/clinical-record/referral-slip.action";
import ActionButton from "@/components/ActionButton";
import { PatientProfile } from "@/components/consultation/ConsultationDetails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SearchableDropdown, SearchableDropdownOption } from "@/components/ui/searchable-dropdown";
import { GroupedSearchableDropdown } from "@/components/ui/grouped-searchable-dropdown";
import { UnsavedChangesAlert } from "@/components/UnsavedChangesAlert";
import { useReferralReasons } from "@/hooks/useReferralReasons";
import { useReferralTargets } from "@/hooks/useReferralTargets";
import { calculateAge, cn } from "@/lib/utils";
import { promiseWrapper } from "@/lib/with-error-handling";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, User, ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const createReferralSlipSchema = z.object({
  patientName: z.string({
    required_error: "Patient name is required",
    invalid_type_error: "Invalid patient name",
  }),
  dob: z.date()
    .refine((val) => {
      const today = new Date();
      return val <= today;
    }, "Date of birth cannot be in the future")
    .optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  address: z.string({
    required_error: "Address is required",
    invalid_type_error: "Invalid address",
  }),
  chiefComplaint: z.string({
    required_error: "Chief complaint is required",
    invalid_type_error: "Invalid chief complaint",
  }),
  history: z.string().optional(),
  impression: z.string().optional(),
  recommendation: z.string().optional(),
  reason: z.string({
    required_error: "You need to enter a referral reason.",
    invalid_type_error: "Invalid referral reason",
  }).min(1, "Referral reason is required"),
  referredTo: z.string({
    required_error: "You need to enter who to refer to.",
    invalid_type_error: "Invalid referred to field",
  }).min(1, "Referred to field is required"),
})

interface CreateReferralSlipModalProps {
  clinicUid: string;
  patientId?: number;
  hpIds: number[];
  consultationTicketId: number;
  onCreateReferralSlip?: () => void;
  userInfo?: PatientProfile | null;
  appointment: {
    id: number;
    complaint: string;
  }
}

export default function CreateReferralSlipModal({
  clinicUid,
  patientId,
  hpIds,
  consultationTicketId,
  onCreateReferralSlip,
  userInfo,
  appointment
}: CreateReferralSlipModalProps) {

  const [isOpen, setIsOpen] = React.useState(false);
  const [showAlert, setShowAlert] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPatientInfo, setShowPatientInfo] = React.useState(false);

  const { result: referralReasons } = useReferralReasons();
  const { groups: referralTargetGroups } = useReferralTargets(clinicUid);

  const reasonOptions: SearchableDropdownOption[] = React.useMemo(() => {
    if (!referralReasons) return [];
    return referralReasons.map(reason => ({
      value: reason.name,
      label: reason.name,
    }));
  }, [referralReasons]);

  const autofillDefaults = React.useMemo(() => {
    return {
      patientName: [
        userInfo?.firstName ?? "",
        userInfo?.middleName ?? "",
        userInfo?.lastName ?? "",
        userInfo?.suffix ?? "",
      ].filter(Boolean).join(" "),
      dob: userInfo?.dob ? new Date(userInfo.dob) : undefined,
      gender: (userInfo?.gender === "MALE" || userInfo?.gender === "FEMALE") ? userInfo.gender as "MALE" | "FEMALE" : undefined,
      address: userInfo?.address ? [
        userInfo.address.homeAddress ?? "",
        userInfo.address.city ?? "",
        userInfo.address.state ?? "",
        userInfo.address.zipCode ?? "",
        userInfo.address.country ?? "",
      ].filter(Boolean).join(", ") : "",
      chiefComplaint: appointment.complaint ?? "",
      history: "",
      impression: "",
      recommendation: "",
      reason: "",
      referredTo: "",
    }
  }, [userInfo, appointment.complaint])

  const form = useForm<z.infer<typeof createReferralSlipSchema>>({
    resolver: zodResolver(createReferralSlipSchema),
    defaultValues: autofillDefaults,

  })

  const resetFormWithDefaults = React.useCallback(() => {
    form.reset({
      ...autofillDefaults,
      chiefComplaint: appointment.complaint,
      history: "",
      impression: "",
      recommendation: "",
      reason: "",
      referredTo: "",
    })
  }, [form, autofillDefaults, appointment.complaint]);

  const action = React.useCallback(async (data: z.infer<typeof createReferralSlipSchema>) => {
    setIsSubmitting(true);
    toast.promise(promiseWrapper(createReferralSlipAction)({
      clinicUid,
      patientId,
      hpIds,
      consultationTicketId,
      referredTo: data.referredTo,
      appointmentId: appointment.id,
      history: data.history ?? "",
      impression: data.impression ?? "",
      recommendation: data.recommendation ?? "",
      reason: data.reason,
    }), {
      loading: "Creating referral slip...",
      success: (res) => {
        setIsOpen(false);
        onCreateReferralSlip?.();
        resetFormWithDefaults();
        return res.message || "Referral slip created successfully";
      },
      error: (err) => err.message || "Failed to create referral slip",
      finally: () => {
        setIsSubmitting(false);
      }
    })
  }, [clinicUid, consultationTicketId, hpIds, onCreateReferralSlip, patientId, resetFormWithDefaults, appointment.id])

  const hasUnsavedChanges = React.useCallback(() => {
    const values = form.getValues();
    return !!(
      values.referredTo ||
      values.chiefComplaint ||
      values.history ||
      values.impression ||
      values.recommendation ||
      values.reason
    );
  }, [form]);

  const handleClose = React.useCallback((newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges()) {
      setShowAlert(true);
    } else {
      setIsOpen(newOpen);
      if (!newOpen) {
        resetFormWithDefaults();
      }
    }
  }, [hasUnsavedChanges, resetFormWithDefaults]);

  const handleConfirmClose = React.useCallback(() => {
    setShowAlert(false);
    setIsOpen(false);
    resetFormWithDefaults();
  }, [resetFormWithDefaults]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Referral Slip
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl w-full">

          {/* Header */}
          <DialogHeader>
            <DialogTitle>Create Referral Slip</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a referral slip for the patient.
            </DialogDescription>
          </DialogHeader>

          {/* Body */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(action)} id="create-referral-slip-form" className="space-y-6">
              <div className="max-h-[60vh] overflow-y-scroll no-scrollbar space-y-6">

                {/* Patient Information Card */}
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
                              Age: {calculateAge(userInfo?.dob) ?? 'N/A'}
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
                                  placeholder="Enter patient name"
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

                      {/* Address Field */}
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600">Address</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter address"
                                {...field}
                                disabled
                                className="bg-gray-50 text-gray-700 border-gray-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Chief Complaint Field */}
                      <FormField
                        control={form.control}
                        name="chiefComplaint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600">Chief Complaint</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter chief complaint"
                                {...field}
                                disabled
                                className="resize-none bg-gray-50 text-gray-700 border-gray-200 min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  )}
                </Card>

                {/* Referral Information */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Referral <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <SearchableDropdown
                            options={reasonOptions}
                            value={field.value}
                            placeholder="Search or enter referral reason..."
                            onSelect={(option) => {
                              field.onChange(option.value);
                            }}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            renderOption={(option) => (
                              <div className="flex flex-col">
                                <span>{option.label}</span>
                                {typeof option.description === "string" && (
                                  <span className="text-sm text-muted-foreground">{option.description}</span>
                                )}
                              </div>
                            )}
                            emptyMessage="No referral reasons found."
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a reason for the referral slip.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referredTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referred To <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <GroupedSearchableDropdown
                            groups={referralTargetGroups}
                            value={field.value}
                            placeholder="Search clinics or healthcare providers..."
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            onSelect={(option) => {
                              field.onChange(option.label);
                            }}
                            renderOption={(option) => (
                              <div className="flex items-center justify-between w-full">
                                <span>{option.label}</span>
                                {option.type === 'healthcare_provider' && typeof option.specialty === "string" && (
                                  <Badge variant="secondary" className="ml-2">
                                    {option.specialty}
                                  </Badge>
                                )}
                                {option.type === 'clinic' && typeof option.description === "string" && (
                                  <span className="text-xs text-muted-foreground ml-2 truncate">
                                    {option.description}
                                  </span>
                                )}
                              </div>
                            )}
                            emptyMessage="No clinics or healthcare providers found."
                          />
                        </FormControl>
                        <FormDescription>
                          Specify the clinic or healthcare provider to refer to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Clinical Information */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="history"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brief History & Pertinent PE</FormLabel>
                        <FormControl>
                          <textarea
                            id="history"
                            placeholder="Enter history"
                            {...field}
                            className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary resize-none"
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a brief history and pertinent physical examination findings. (Optional)
                        </FormDescription>
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
                            placeholder="Enter impression"
                            {...field}
                            className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary resize-none"
                          />
                        </FormControl>
                        <FormDescription>
                          Provide your clinical impression of the patient&apos;s condition. (Optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recommendation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recommendation</FormLabel>
                        <FormControl>
                          <textarea
                            id="recommendation"
                            placeholder="Enter recommendation"
                            {...field}
                            className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary resize-none"
                          />
                        </FormControl>
                        <FormDescription>
                          Provide your recommendation for the patient&apos;s care. (Optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>

          {/* Footer */}
          <DialogFooter>
            <ActionButton
              type="submit"
              form="create-referral-slip-form"
              className="bg-black text-white hover:bg-gray-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </ActionButton>
          </DialogFooter>
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