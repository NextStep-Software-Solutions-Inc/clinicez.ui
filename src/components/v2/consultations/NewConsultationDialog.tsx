"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { createConsultationTicketAction } from "@/actions/consultation/consultation-ticket.action";
import { getPatientConfirmedAppointmentsAction } from "@/actions/appointments/get-patient-confirmed-appointments.action";
import type { GetPatientConsultations } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import type { GetSystems } from "@/actions/system.action";
import type { GetPatientConfirmedAppointments } from "@/actions/appointments/get-patient-confirmed-appointments.action";
import dayjs from "@/lib/day-utils";

type Consultation = NonNullable<GetPatientConsultations["data"]>[number];
type ConfirmedAppointment = NonNullable<
  GetPatientConfirmedAppointments["data"]
>[number];

const schema = z.object({
  subject: z.string().optional(),
  systemId: z.coerce.number().min(1, "Please select a system"),
  hpId: z.coerce.number().min(1, "Please select your HP profile"),
  appointmentId: z.coerce.number().optional(),
});
type FormValues = z.infer<typeof schema>;

interface NewConsultationDialogProps {
  clinicUid: string;
  patient: { id: number; clinicPatientId: number; userId: string; fullName: string };
  myHPs: NonNullable<GetHPsType>;
  systems: NonNullable<GetSystems>;
  onCreated: (ticket: Consultation) => void;
  children: React.ReactNode;
}

export default function NewConsultationDialog({
  clinicUid,
  patient,
  myHPs,
  systems,
  onCreated,
  children,
}: NewConsultationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [linkToAppointment, setLinkToAppointment] = useState(false);
  const [confirmedAppointments, setConfirmedAppointments] = useState<ConfirmedAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      systemId: systems[0]?.id,
      hpId: myHPs[0]?.id,
      appointmentId: undefined,
    },
  });

  const handleLinkToggle = (checked: boolean) => {
    setLinkToAppointment(checked);
    if (checked && confirmedAppointments.length === 0) {
      setLoadingAppointments(true);
      getPatientConfirmedAppointmentsAction({
        clinicUid,
        patientUserId: patient.userId,
      })
        .then((result) => {
          setConfirmedAppointments(result.data ?? []);
        })
        .catch(() => {
          toast.error("Failed to load confirmed appointments");
        })
        .finally(() => {
          setLoadingAppointments(false);
        });
    }
    if (!checked) {
      form.setValue("appointmentId", undefined);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset();
      setLinkToAppointment(false);
      setConfirmedAppointments([]);
    }
  };

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createConsultationTicketAction({
        clinicUid,
        systemId: values.systemId,
        hpIds: [values.hpId],
        subject: values.subject || undefined,
        appointmentId: linkToAppointment ? values.appointmentId : undefined,
      });

      if (result.status && result.data) {
        toast.success(result.message ?? "Consultation created");
        handleOpenChange(false);

        // Build a minimal consultation object for the list
        const hp = myHPs.find((h) => h.id === values.hpId);
        const newConsultation: Consultation = {
          id: result.data.id,
          subject: values.subject ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isArchived: false,
          caseNumber: null,
          ConsultationTicketAttribute: { status: "PROCESSING" },
          ConsultationTicketHPs: hp
            ? [
                {
                  HealthCareProvider: {
                    id: hp.id,
                    HPProfile: hp.HPProfile ?? null,
                    User: {
                      firstName: hp.User?.firstName ?? null,
                      lastName: hp.User?.lastName ?? null,
                    },
                    HPType: { name: hp.HPType?.name ?? "" },
                  },
                },
              ]
            : [],
          ConsultationNotes: [],
          Prescriptions: [],
          MedicalCertificates: [],
          LaboratoryRequests: [],
          ImagingRequests: [],
          Appointment: null,
        };
        onCreated(newConsultation);
      } else {
        toast.error(result.message ?? "Failed to create consultation");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div onClick={() => setOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(true)}>
        {children}
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Consultation</DialogTitle>
          <DialogDescription>
            Starting a consultation for <strong>{patient.fullName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hpId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consulting as</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your HP profile" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {myHPs.map((hp) => (
                        <SelectItem key={hp.id} value={hp.id.toString()}>
                          {hp.HPProfile?.title
                            ? `${hp.HPProfile.title} ${hp.HPProfile.name}`
                            : `${hp.User?.firstName ?? ""} ${hp.User?.lastName ?? ""}`.trim()}
                          {hp.HPType?.name ? ` (${hp.HPType.name})` : ""}
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
              name="systemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System / Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select system" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {systems.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Link to appointment toggle */}
            <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="link-appointment-toggle" className="text-sm font-medium cursor-pointer">
                  Link to a confirmed appointment?
                </Label>
                <Switch
                  id="link-appointment-toggle"
                  checked={linkToAppointment}
                  onCheckedChange={handleLinkToggle}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Optional — skip this if the consultation is not tied to a scheduled appointment.
              </p>
            </div>

            {linkToAppointment && (
              <FormField
                control={form.control}
                name="appointmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select appointment</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Prefill the subject field with the selected appointment's complaint
                        const selected = confirmedAppointments.find(
                          (a) => a.id.toString() === value
                        );
                        if (selected) {
                          form.setValue(
                            "subject",
                            selected.complaint ?? selected.subject ?? ""
                          );
                        }
                      }}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingAppointments
                                ? "Loading…"
                                : "Select a confirmed appointment"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {confirmedAppointments.length === 0 && !loadingAppointments ? (
                          <SelectItem value="none" disabled>
                            No confirmed appointments found
                          </SelectItem>
                        ) : (
                          confirmedAppointments.map((appt) => (
                            <SelectItem key={appt.id} value={appt.id.toString()}>
                              <span className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                                <span>
                                  {appt.subject ?? appt.complaint ?? "Appointment"}
                                  {appt.AppointmentAttribute?.date
                                    ? ` · ${dayjs(appt.AppointmentAttribute.date).format("MMM D, YYYY")}`
                                    : ""}
                                </span>
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chief Complaint / Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Routine check-up, Headache…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating…" : "Start Consultation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
