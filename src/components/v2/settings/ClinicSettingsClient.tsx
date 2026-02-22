"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  Bell,
  Zap,
  Calendar,
  Heart,
  Users,
  Save,
  Loader2,
  Mail,
  Globe,
  Lock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { updateClinicAction } from "@/actions/clinics/clinic.action";
import { updatePhilHealthSettingsAction } from "@/actions/clinics/clinic-setting.action";
import { upsertClinicAppointmentConfigAction } from "@/actions/appointments/appointment-config.action";

import type { GetClinic } from "@/actions/clinics/clinic.action";
import type { GetClinicSetting } from "@/actions/clinics/clinic-setting.action";
import type { GetClinicAppointmentConfig } from "@/actions/appointments/appointment-config.action";
import type { GetClinicMembers } from "@/actions/clinics/clinic-member.action";

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

type ClinicData = NonNullable<GetClinic["data"]>;
type ClinicSettingData = NonNullable<GetClinicSetting["data"]>;
type AppointmentConfigData = NonNullable<GetClinicAppointmentConfig>;
type MembersData = NonNullable<GetClinicMembers["data"]>;

interface ClinicSettingsClientProps {
  clinicUid: string;
  clinic: ClinicData;
  clinicSetting: ClinicSettingData | null;
  appointmentConfig: AppointmentConfigData | null;
  members: MembersData;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Zod schemas                                                        */
/* ─────────────────────────────────────────────────────────────────── */

const generalSchema = z.object({
  name: z.string().min(1, "Clinic name is required"),
  description: z.string().optional(),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  customUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  logo: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  isPublic: z.boolean(),
  sendEmailNotification: z.boolean(),
  emailToClinicOnly: z.boolean(),
  enableAppointment: z.boolean(),
  enableConsultation: z.boolean(),
});
type GeneralFormValues = z.infer<typeof generalSchema>;

const appointmentSchema = z.object({
  maxAppointmentsPerClient: z.coerce.number().int().min(0),
  perClientResetInterval: z.coerce.number().int().min(0),
  maxAppointmentsPerDay: z.coerce.number().int().min(0),
  privacyPolicyUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  termsAndConditionsUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
});
type AppointmentFormValues = z.infer<typeof appointmentSchema>;

const philhealthSchema = z.object({
  philhealthAccreditationNumber: z.string().optional(),
  facilityName: z.string().optional(),
});
type PhilHealthFormValues = z.infer<typeof philhealthSchema>;

/* ─────────────────────────────────────────────────────────────────── */
/*  Helper: SettingRow                                                 */
/* ─────────────────────────────────────────────────────────────────── */

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-0.5 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: General                                                       */
/* ─────────────────────────────────────────────────────────────────── */

function GeneralTab({
  clinicUid,
  clinic,
  clinicSetting,
}: {
  clinicUid: string;
  clinic: ClinicData;
  clinicSetting: ClinicSettingData | null;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: clinic.name ?? "",
      description: clinic.description ?? "",
      email: clinic.email ?? "",
      customUrl: clinic.customUrl ?? "",
      logo: clinic.logo ?? "",
      isPublic: clinicSetting?.isPublic ?? false,
      sendEmailNotification: clinicSetting?.sendEmailNotification ?? true,
      emailToClinicOnly: clinicSetting?.emailToClinicOnly ?? false,
      enableAppointment: clinicSetting?.enableAppointment ?? true,
      enableConsultation: clinicSetting?.enableConsultation ?? true,
    },
  });

  const onSubmit = (values: GeneralFormValues) => {
    startTransition(async () => {
      const result = await updateClinicAction(clinicUid, {
        name: values.name,
        description: values.description,
        logo: values.logo ?? "",
        customUrl: values.customUrl,
        email: values.email,
        isPublic: values.isPublic,
        sendEmailNotification: values.sendEmailNotification,
        emailToClinicOnly: values.emailToClinicOnly,
        enableAppointment: values.enableAppointment,
        enableConsultation: values.enableConsultation,
      });

      if (result.status) {
        toast.success("Clinic settings saved successfully.");
      } else {
        toast.error(result.message ?? "Failed to save clinic settings.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Update your clinic&apos;s profile and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. City Medical Clinic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="clinic@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourclinic.com" {...field} />
                    </FormControl>
                    <FormDescription>Public-facing website URL.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://cdn.example.com/logo.png" {...field} />
                    </FormControl>
                    <FormDescription>Direct link to the clinic logo image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief description of the clinic…"
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Visibility & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Visibility &amp; Notifications
            </CardTitle>
            <CardDescription>
              Control who can discover the clinic and how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem>
                  <SettingRow
                    label="Public Clinic"
                    description="Allow patients to discover and book appointments online."
                  >
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </SettingRow>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sendEmailNotification"
              render={({ field }) => (
                <FormItem>
                  <SettingRow
                    label="Email Notifications"
                    description="Send email alerts for new appointments and updates."
                  >
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </SettingRow>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailToClinicOnly"
              render={({ field }) => (
                <FormItem>
                  <SettingRow
                    label="Clinic-Only Emails"
                    description="Send notification emails only to clinic staff, not patients."
                  >
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </SettingRow>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Feature Toggles
            </CardTitle>
            <CardDescription>
              Enable or disable key clinical modules for this clinic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField
              control={form.control}
              name="enableAppointment"
              render={({ field }) => (
                <FormItem>
                  <SettingRow
                    label="Appointment Module"
                    description="Allow staff and patients to manage appointments."
                  >
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </SettingRow>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enableConsultation"
              render={({ field }) => (
                <FormItem>
                  <SettingRow
                    label="Consultation Module"
                    description="Enable consultation queues, notes, prescriptions, and diagnostics."
                  >
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </SettingRow>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="min-w-[120px]">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Appointments                                                  */
/* ─────────────────────────────────────────────────────────────────── */

function AppointmentsTab({
  clinicUid,
  appointmentConfig,
  clinic,
}: {
  clinicUid: string;
  appointmentConfig: AppointmentConfigData | null;
  clinic: ClinicData;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      maxAppointmentsPerClient: appointmentConfig?.maxAppointmentsPerClient ?? 0,
      perClientResetInterval: appointmentConfig?.perClientResetInterval ?? 0,
      maxAppointmentsPerDay: appointmentConfig?.maxAppointmentsPerDay ?? 0,
      privacyPolicyUrl: appointmentConfig?.privacyPolicyUrl ?? "",
      termsAndConditionsUrl: appointmentConfig?.termsAndConditionsUrl ?? "",
    },
  });

  const onSubmit = (values: AppointmentFormValues) => {
    startTransition(async () => {
      const result = await upsertClinicAppointmentConfigAction(
        appointmentConfig?.id ?? 0,
        {
          clinicUid,
          maxAppointmentsPerClient: values.maxAppointmentsPerClient,
          perClientResetInterval: values.perClientResetInterval,
          maxAppointmentsPerDay: values.maxAppointmentsPerDay,
          privacyPolicyUrl: values.privacyPolicyUrl || undefined,
          termsAndConditionsUrl: values.termsAndConditionsUrl || undefined,
        },
      );

      if (result.status) {
        toast.success("Appointment configuration saved.");
      } else {
        toast.error(result.message ?? "Failed to save appointment configuration.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Capacity Limits
            </CardTitle>
            <CardDescription>
              Set maximum appointments allowed per client and per day. Use{" "}
              <strong>0</strong> for no limit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="maxAppointmentsPerClient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Appointments per Client</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormDescription>0 = unlimited</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="perClientResetInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reset Interval (days)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormDescription>
                      Days before the per-client count resets. 0 = never.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxAppointmentsPerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Appointments per Day</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormDescription>0 = unlimited</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Legal Documents
            </CardTitle>
            <CardDescription>
              Links shown to patients during the appointment booking flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField
              control={form.control}
              name="privacyPolicyUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Policy URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/privacy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="termsAndConditionsUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms &amp; Conditions URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/terms" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="min-w-[120px]">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: PhilHealth / Facility                                         */
/* ─────────────────────────────────────────────────────────────────── */

function PhilHealthTab({
  clinicUid,
  clinicSetting,
}: {
  clinicUid: string;
  clinicSetting: ClinicSettingData | null;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<PhilHealthFormValues>({
    resolver: zodResolver(philhealthSchema),
    defaultValues: {
      philhealthAccreditationNumber: clinicSetting?.philhealthAccreditationNumber ?? "",
      facilityName: clinicSetting?.facilityName ?? "",
    },
  });

  const onSubmit = (values: PhilHealthFormValues) => {
    startTransition(async () => {
      const result = await updatePhilHealthSettingsAction(clinicUid, {
        philhealthAccreditationNumber: values.philhealthAccreditationNumber || undefined,
        facilityName: values.facilityName || undefined,
      });

      if (result.status) {
        toast.success("PhilHealth settings saved.");
      } else {
        toast.error(result.message ?? "Failed to save PhilHealth settings.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              PhilHealth &amp; Facility Details
            </CardTitle>
            <CardDescription>
              Required for generating PhilHealth EKAS authorizations and official documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField
              control={form.control}
              name="facilityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. City Medical Center" {...field} />
                  </FormControl>
                  <FormDescription>
                    Official facility name as registered with PhilHealth.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="philhealthAccreditationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PhilHealth Accreditation Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. PHA-000000" {...field} />
                  </FormControl>
                  <FormDescription>
                    Printed on all PhilHealth-related documents issued by this clinic.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="min-w-[120px]">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Members                                                       */
/* ─────────────────────────────────────────────────────────────────── */

function MembersTab({ members }: { members: MembersData }) {
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = firstName?.charAt(0) ?? "";
    const l = lastName?.charAt(0) ?? "";
    return (f + l).toUpperCase() || "?";
  };

  const statusVariant = (status: string) => {
    if (status === "ACTIVE") return "default";
    if (status === "PENDING") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Clinic Members
          </CardTitle>
          <CardDescription>
            Staff members who have access to this clinic. Manage roles and permissions from the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No members found for this clinic.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={member.User.picture ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.User.firstName, member.User.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {[member.User.firstName, member.User.middleName, member.User.lastName, member.User.suffix]
                        .filter(Boolean)
                        .join(" ") || member.User.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{member.User.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {member.Role.name}
                    </Badge>
                    <Badge variant={statusVariant(member.status)} className="text-xs">
                      {member.status === "ACTIVE" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {member.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Root component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export function ClinicSettingsClient({
  clinicUid,
  clinic,
  clinicSetting,
  appointmentConfig,
  members,
}: ClinicSettingsClientProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clinic Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure every aspect of <span className="font-medium text-foreground">{clinic.name}</span>.
        </p>
      </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="general" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="philhealth" className="gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            PhilHealth
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Members
            {members.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                {members.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralTab
            clinicUid={clinicUid}
            clinic={clinic}
            clinicSetting={clinicSetting}
          />
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <AppointmentsTab
            clinicUid={clinicUid}
            appointmentConfig={appointmentConfig}
            clinic={clinic}
          />
        </TabsContent>

        <TabsContent value="philhealth" className="mt-6">
          <PhilHealthTab
            clinicUid={clinicUid}
            clinicSetting={clinicSetting}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersTab members={members} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
