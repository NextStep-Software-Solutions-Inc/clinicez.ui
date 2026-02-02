import { Button } from "@components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet"

import { useEffect, useRef, useState } from "react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Textarea } from "@components/ui/textarea";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { upsertPreAssessmentNoteAction } from "@actions/appointments/pre-assessment-note.action";
import { useClinicAppointment } from "@hooks/useAppointment";
import { Checkbox } from "@components/ui/checkbox";
import { useUser } from "@clerk/nextjs";
import { useLocalStorage } from "@hooks/useLocalStorage";
import { promiseWrapper } from "@/lib/with-error-handling";
import { PreAssessmentAIAssistant } from "@/components/ai/PreAssessmentAIAssistant";
import { Sparkles, Loader2 } from "lucide-react";
import { isAIEnabled } from "@/lib/ai";
import { usePreAssessmentAI } from "@/hooks/ai/use-pre-assessment-ai";
import { calculateAge } from "@/lib/utils";
import { ScrollArea } from "@components/ui/scroll-area";
import { getUserAllergiesAction } from "@actions/users/user-allergy.action";
import { getUserVitalSignsAction } from "@actions/vitals.action";


const preAssessmentNotesSchema = z.object({
  createNew: z.boolean(),
  assessment: z.string({
    required_error: "Assessment is required",
  }),
  homeInstructions: z.string().optional(),
  remarks: z.string({
    required_error: "Remarks are required",
  })
})

type PreConsultationNotes = z.infer<typeof preAssessmentNotesSchema>

interface PreAssessmentNoteSheetProps {
  children: React.ReactNode
  preAssessmentNotes: {
    assessment: string
    homeInstructions?: string
    remarks: string
    appointmentId: number
    clinicUid: string
    CreatedBy?: {
      userId: string;
    }
  }
  disabled?: boolean
}
export default function PreAssessmentNoteSheet({ children, disabled, preAssessmentNotes: { assessment, homeInstructions, remarks, appointmentId: appointmentId, clinicUid, CreatedBy } }: PreAssessmentNoteSheetProps) {
  const preConSultKey = `preAssessmentNote-${appointmentId}-${clinicUid}`
  const [preAssessmentNote, setPreAssessmentNote] = useLocalStorage<Partial<PreConsultationNotes>>(preConSultKey, {
    assessment,
    homeInstructions,
    remarks,
    createNew: false
  })

  const { user } = useUser()
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const { data: appointmentData, mutate } = useClinicAppointment({
    appointmentId: appointmentId,
    clinicUid
  })

  // Check if current user is a healthcare provider
  const [isHealthcareProvider, setIsHealthcareProvider] = useState<boolean>(false);
  const [hpCheckLoading, setHpCheckLoading] = useState<boolean>(true);

  // Quick AI generation hook
  const { generate: quickGenerate, isLoading: isQuickGenerating, generatedNotes: quickGeneratedNotes } = usePreAssessmentAI();

  // State for patient health data
  const [patientAllergies, setPatientAllergies] = useState<any[]>([]);
  const [patientVitals, setPatientVitals] = useState<any[]>([]);
  const [appointmentAttachments, setAppointmentAttachments] = useState<any[]>([]);

  const form = useForm<PreConsultationNotes>({
    defaultValues: {
      createNew: preAssessmentNote.createNew,
      assessment: preAssessmentNote.assessment,
      homeInstructions: preAssessmentNote.homeInstructions,
      remarks: preAssessmentNote.remarks
    },
  })
  const watch = form.watch

  // Check if current user is a healthcare provider in this clinic
  useEffect(() => {
    const checkHealthcareProvider = async () => {
      try {
        setHpCheckLoading(true);
        const { isClinicHealthcareProvider } = await import('@/lib/clinic-utils');
        const isHP = await isClinicHealthcareProvider(clinicUid);
        setIsHealthcareProvider(isHP);
      } catch (error) {
        console.error('Error checking healthcare provider status:', error);
        setIsHealthcareProvider(false);
      } finally {
        setHpCheckLoading(false);
      }
    };

    checkHealthcareProvider();
  }, [clinicUid]);

  // Fetch patient allergies, vitals, and attachments when appointment data is available
  useEffect(() => {
    const fetchPatientHealthData = async () => {
      if (!appointmentData?.data) return;
      
      const patient = appointmentData.data.Requesters?.[0]?.User;
      if (!patient?.userId) return;

      try {
        // Fetch allergies
        const allergies = await getUserAllergiesAction(patient.userId);
        setPatientAllergies(allergies || []);

        // Fetch recent vitals (last 5)
        const vitals = await getUserVitalSignsAction(patient.userId);
        if (vitals && vitals.length > 0) {
          // Get last 5 vitals, sorted by date (most recent first)
          const sortedVitals = [...vitals]
            .sort((a: any, b: any) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime())
            .slice(0, 5);
          setPatientVitals(sortedVitals);
        }

        // Extract attachments from appointment data
        if (appointmentData.data.AppointmentAttachments) {
          setAppointmentAttachments(appointmentData.data.AppointmentAttachments);
        }
      } catch (error) {
        console.error('Error fetching patient health data:', error);
      }
    };

    fetchPatientHealthData();
  }, [appointmentData]);

  useEffect(() => {
    const subscription = watch((value) => setPreAssessmentNote(value))
    return () => subscription.unsubscribe()
  }, [setPreAssessmentNote, watch])

  // Auto-apply quick generated notes when ready
  useEffect(() => {
    if (quickGeneratedNotes) {
      form.setValue('assessment', quickGeneratedNotes.assessment);
      form.setValue('homeInstructions', quickGeneratedNotes.homeInstructions);
      form.setValue('remarks', quickGeneratedNotes.remarks);
      toast.success('AI-generated notes applied successfully');
    }
  }, [quickGeneratedNotes, form]);



  // Quick AI Generate - auto-extracts comprehensive data from appointment and patient records
  const handleQuickAIGenerate = async () => {
    if (!appointmentData?.data) {
      toast.error('Appointment data not available');
      return;
    }

    const appointment = appointmentData.data;
    const patient = appointment.Requesters?.[0]?.User;

    if (!patient) {
      toast.error('Patient data not available');
      return;
    }

    // Extract patient data
    const age = patient?.dob ? calculateAge(patient.dob) ?? undefined : undefined;
    const gender = patient?.gender || undefined;
    const chiefComplaint = appointment.complaint || appointment.subject || undefined;
    
    // Use chief complaint as symptoms if available
    const symptoms = chiefComplaint || 'Patient consultation';

    // Format allergies for AI
    const allergies = patientAllergies.map((allergy: any) => ({
      allergen: allergy.Allergen?.name || '',
      reaction: allergy.reaction || '',
      notes: allergy.notes || undefined,
    }));

    // Format recent vitals for AI
    const recentVitals = patientVitals.map((vital: any) => ({
      dateTaken: vital.dateTaken,
      temp: vital.temp,
      pulseRate: vital.pulseRate,
      respRate: vital.respRate,
      spo2: vital.spo2,
      weight: vital.weight,
      height: vital.height,
      bmi: vital.bmi,
      bpSystolic: vital.bpSystolic,
      bpDiastolic: vital.bpDiastolic,
    }));

    // Format attachments for AI (images only)
    const attachments = appointmentAttachments.map((att: any) => ({
      name: att.name,
      url: att.url,
      type: att.type,
    }));

    try {
      await quickGenerate(
        symptoms,
        {
          age,
          gender,
          chiefComplaint,
          recentVitals: recentVitals.length > 0 ? recentVitals : undefined,
          allergies: allergies.length > 0 ? allergies : undefined,
          // Can be extended with comorbidities and medical history if available
        },
        attachments.length > 0 ? attachments : undefined
      );
    } catch (error) {
      toast.error('Failed to generate notes. Please try again.');
    }
  };

  const action = () => {
    form.handleSubmit((data) => {
      toast.promise(promiseWrapper(upsertPreAssessmentNoteAction)({
        appointmentId,
        assessment: data.assessment,
        homeInstructions: data.homeInstructions,
        remarks: data.remarks,
        clinicUid
      }), {
        loading: "Saving Pre-Assessment Note...",
        success: (res) => {
          form.reset(data)
          mutate()
          closeBtnRef.current?.click()
          return res.message
        },
        error: error => error
      })
    })()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {disabled ? <button disabled className="disabled:bg-gray-100 p-1 rounded w-full">{children}</button> : children}

      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
        <Form {...form}>
          <form action={action} className="flex flex-col h-full">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle className="flex items-center justify-between">
                <span>Pre Assessment Notes</span>
                <div className="flex gap-2">
                  {isAIEnabled() && !hpCheckLoading && isHealthcareProvider && (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleQuickAIGenerate}
                        disabled={isQuickGenerating}
                      >
                        {isQuickGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            AI Generate
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </SheetTitle>
              <SheetDescription>
                Notes to be taken before the actual consultation. Can be completed by any healthcare provider with the appropriate permissions.
                {isAIEnabled() && !hpCheckLoading && isHealthcareProvider && (
                  <span className="block mt-2 text-xs text-muted-foreground">
                    💡 Click "AI Generate" for instant AI-assisted notes using comprehensive patient data including vitals, allergies, and medical history.
                  </span>
                )}
                {isAIEnabled() && !hpCheckLoading && !isHealthcareProvider && (
                  <span className="block mt-2 text-xs text-amber-600">
                    ℹ️ AI assistance tools are available for healthcare providers to aid in clinical documentation.
                  </span>
                )}
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 pb-6">
                <FormField
                  control={form.control}
                  name="assessment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your assessment here"
                          className="resize-y min-h-[120px]"
                          disabled={isQuickGenerating}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>

                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="homeInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Instructions (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write home instructions here"
                          className="resize-y min-h-[100px]"
                          disabled={isQuickGenerating}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>

                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write remarks here"
                          className="resize-y min-h-[100px]"
                          disabled={isQuickGenerating}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>

                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {
                  CreatedBy?.userId !== user?.id &&
                  <FormField
                    control={form.control}
                    name="createNew"
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
                            Create a new pre-consultation note
                          </FormLabel>
                          <FormDescription>
                            If checked, a new pre-consultation note will be created in place of the existing one.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                }
              </div>
            </ScrollArea>

            <SheetFooter className="px-6 py-4 border-t">
              <SheetClose asChild>
                <Button ref={closeBtnRef} variant="outline" type="button">Close</Button>
              </SheetClose>
              <ActionButton type="submit">Save</ActionButton>
            </SheetFooter>

          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}


