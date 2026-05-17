"use client";

import { useState, useTransition, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Globe,
  CheckCircle2,
  XCircle,
  UserPlus,
  Search,
  Crown,
  Trash2,
  ChevronDown,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Shield,
  Pencil,
  Plus,
  Package,
  Layers,
  Clock,
  Settings2,
  ListChecks,
  ChevronRight,
  KeyRound,
  Link2,
  AlertTriangle,
  FileText,
  HelpCircle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { updateClinicAction } from "@/actions/clinics/clinic.action";
import { updatePhilHealthSettingsAction } from "@/actions/clinics/clinic-setting.action";
import {
  bootstrapClinicKonsultaLibrariesAction,
  createClinicKonsultaLibraryItemAction,
  getClinicKonsultaLibraryDomainItemsAction,
  getClinicKonsultaMappingAuditHistoryAction,
  getClinicKonsultaLibrarySummaryAction,
  searchPhilHealthKonsultaReferencesAction,
  type GetClinicKonsultaMappingAuditHistory,
  type GetClinicKonsultaLibrarySummary,
  updateClinicKonsultaLibraryMappingAction,
} from "@/actions/clinics/konsulta-library.action";
import { upsertClinicAppointmentConfigAction } from "@/actions/appointments/appointment-config.action";
import {
  addClinicMemberAction,
  updateClinicMemberRoleAction,
  removeClinicMemberAction,
  searchNonMembersAction,
  resetClinicMemberPermissionsAction,
} from "@/actions/clinics/clinic-member.action";
import { setClinicMemberPermissionsAction } from "@/actions/clinics/clinic-member-permission.action";
import {
  createAppointmentModeAction,
  updateAppointmentModeAction,
  deleteAppointmentModeAction,
} from "@/actions/appointments/appointment-mode.action";
import {
  createAppointmentTypeAction,
  updateAppointmentTypeAction,
  deleteAppointmentTypeAction,
} from "@/actions/appointments/appointment-type.action";
import {
  createClinicServiceCategoryAction,
  updateClinicServiceCategoryAction,
  deleteServiceCategoryAction,
} from "@/actions/clinics/clinic-service-category.action";
import {
  createClinicServiceAction,
  updateClinicServiceAction,
  deleteClinicServiceAction,
} from "@/actions/clinics/clinic-service.action";
import {
  createClinicRoleAction,
  updateClinicRoleAction,
  deleteClinicRoleAction,
  setClinicRoleDashboardAccessAction,
  setClinicRoleRestrictToOwnAppointmentsAction,
} from "@/actions/clinics/clinic-role.action";
import { setClinicRoleInitialPermissionsAction } from "@/actions/clinic-role-initial-permission.action";
import {
  setClinicAppointmentTabsAction,
  setClinicRoleAppointmentTabsAction,
} from "@/actions/clinics/clinic-appointment-tab..action";
import {
  createSystemAction,
  updateSystemAction,
  deleteSystemAction,
} from "@/actions/system.action";
import { upsertClinicPrescriptionConfigAction } from "@/actions/medications/prescription-config.action";
import { upsertClinicDocumentDefaultTemplatesAction } from "@/actions/clinics/clinic-document-setting.action";
import { useClinicPrescriptionConfig } from "@/hooks/useClinicPrescriptionConfig";
import { useClinicDocumentSetting } from "@/hooks/useClinicDocumentSetting";
import { useDocumentTemplates } from "@/hooks/useDocumentTemplate";
import { useDocumentTypes } from "@/hooks/useDocumentType";
import DocumentTemplates from "@/components/DocumentTemplates";

import type { GetClinic } from "@/actions/clinics/clinic.action";
import type { GetClinicSetting } from "@/actions/clinics/clinic-setting.action";
import type { GetClinicAppointmentConfig } from "@/actions/appointments/appointment-config.action";
import type { GetClinicMembers, SearchNonMembers } from "@/actions/clinics/clinic-member.action";
import type { GetClinicRoles, GetClinicRolesWithPermissions } from "@/actions/clinics/clinic-role.action";
import type { GetPermissions } from "@/actions/permission.action";
import type { GetAppointmentModes } from "@/actions/appointments/appointment-mode.action";
import type { GetAppointmentTypes } from "@/actions/appointments/appointment-type.action";
import type { GetClinicServiceCategories } from "@/actions/clinics/clinic-service-category.action";
import type { GetClinicAppointmentTabs } from "@/actions/clinics/clinic-appointment-tab..action";
import type { GetAppointmentTabs } from "@/actions/appointment-tab.action";
import { GoogleCalendarIntegration } from "@/components/v2/integrations/GoogleCalendarIntegration";
import { CalendarEventsList } from "@/components/v2/integrations/CalendarEventsList";
import type { CalendarEventItem } from "@/actions/google/auth.action";
import type { GetSystems } from "@/actions/system.action";
import type {
  GetClinicKonsultaLibraryDomainItems,
  SearchPhilHealthKonsultaReferences,
} from "@/actions/clinics/konsulta-library.action";

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

type ClinicData = NonNullable<GetClinic["data"]>;
type ClinicSettingData = NonNullable<GetClinicSetting["data"]>;
type AppointmentConfigData = NonNullable<GetClinicAppointmentConfig>;
type MembersData = NonNullable<GetClinicMembers["data"]>;
type RolesData = NonNullable<GetClinicRoles>;
type UserSearchResult = NonNullable<SearchNonMembers["data"]>[number];
type PermissionsData = NonNullable<GetPermissions>;
type AppointmentModesData = NonNullable<GetAppointmentModes>;
type AppointmentTypesData = NonNullable<GetAppointmentTypes>;
type ServiceCategoriesData = NonNullable<GetClinicServiceCategories>;
type RolesWithPermissionsData = NonNullable<GetClinicRolesWithPermissions>;
type ClinicAppointmentTabsData = NonNullable<GetClinicAppointmentTabs["data"]>;
type AllAppointmentTabsData = NonNullable<GetAppointmentTabs>;
type SystemsData = NonNullable<GetSystems>;
type KonsultaLibrarySummaryData = NonNullable<GetClinicKonsultaLibrarySummary["data"]>;
type KonsultaLibraryDomainItemsData = NonNullable<
  GetClinicKonsultaLibraryDomainItems["data"]
>;
type PhilHealthKonsultaReferenceOptions = NonNullable<
  SearchPhilHealthKonsultaReferences["data"]
>;
type KonsultaMappingAuditHistoryData = NonNullable<
  GetClinicKonsultaMappingAuditHistory["data"]
>;

interface ClinicSettingsClientProps {
  clinicUid: string;
  clinic: ClinicData;
  clinicSetting: ClinicSettingData | null;
  appointmentConfig: AppointmentConfigData | null;
  members: MembersData;
  roles: RolesData;
  rolesWithPermissions: RolesWithPermissionsData;
  allClinicPermissions: PermissionsData;
  appointmentModes: AppointmentModesData;
  appointmentTypes: AppointmentTypesData;
  serviceCategories: ServiceCategoriesData;
  clinicAppointmentTabs: ClinicAppointmentTabsData;
  allAppointmentTabs: AllAppointmentTabsData;
  googleCalendarConnected?: boolean;
  googleCalendarEmail?: string | null;
  googleCalendarEvents?: CalendarEventItem[];
  initialSystems: SystemsData;
  canUpdateSettings?: boolean;
  konsultaLibrarySummary: KonsultaLibrarySummaryData | null;
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
  konsultaUsername: z.string().optional(),
  konsultaPassword: z.string().optional(),
  pmccNumber: z.string().optional(),
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
  initialKonsultaLibrarySummary,
}: {
  clinicUid: string;
  clinicSetting: ClinicSettingData | null;
  initialKonsultaLibrarySummary: KonsultaLibrarySummaryData | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [isLibraryPending, startLibraryTransition] = useTransition();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [librarySummary, setLibrarySummary] = useState<KonsultaLibrarySummaryData | null>(
    initialKonsultaLibrarySummary,
  );
  const [domainItems, setDomainItems] = useState<KonsultaLibraryDomainItemsData>([]);
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false);
  const [selectedDomainKey, setSelectedDomainKey] = useState<string | null>(null);
  const [selectedDomainTitle, setSelectedDomainTitle] = useState<string>("");
  const [domainQuery, setDomainQuery] = useState("");
  const [isLoadingDomainItems, setIsLoadingDomainItems] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemCode, setNewItemCode] = useState("");
  const [mappingItem, setMappingItem] = useState<
    KonsultaLibraryDomainItemsData[number] | null
  >(null);
  const [referenceQuery, setReferenceQuery] = useState("");
  const [referenceOptions, setReferenceOptions] =
    useState<PhilHealthKonsultaReferenceOptions>([]);
  const [selectedReferenceValue, setSelectedReferenceValue] =
    useState<string>("__UNMAPPED__");
  const [mappingAuditHistory, setMappingAuditHistory] =
    useState<KonsultaMappingAuditHistoryData>([]);
  const [mappingAuditError, setMappingAuditError] = useState<string | null>(null);

  const refreshLibrarySummary = useCallback(async () => {
    const result = await getClinicKonsultaLibrarySummaryAction(clinicUid);
    if (result.status && result.data) {
      setLibrarySummary(result.data);
    }
  }, [clinicUid]);
  const loadMappingAuditHistory = useCallback(async () => {
    const result = await getClinicKonsultaMappingAuditHistoryAction(clinicUid);
    if (result.status && result.data) {
      setMappingAuditHistory(result.data);
      setMappingAuditError(null);
      return;
    }

    setMappingAuditHistory([]);
    setMappingAuditError(result.message ?? "Failed to load mapping history.");
  }, [clinicUid]);

  useEffect(() => {
    void loadMappingAuditHistory();
  }, [loadMappingAuditHistory]);

  const loadDomainItems = useCallback(
    async (domainKey: string, query = "") => {
      setIsLoadingDomainItems(true);
      const result = await getClinicKonsultaLibraryDomainItemsAction(
        clinicUid,
        domainKey,
        query,
      );
      if (result.status && result.data) {
        setDomainItems(result.data);
      } else {
        toast.error(result.message ?? "Failed to load domain items.");
      }
      setIsLoadingDomainItems(false);
    },
    [clinicUid],
  );

  const openDomainDialog = useCallback(
    async (domainKey: string, title: string) => {
      setSelectedDomainKey(domainKey);
      setSelectedDomainTitle(title);
      setDomainQuery("");
      setNewItemCode("");
      setNewItemLabel("");
      setIsDomainDialogOpen(true);
      await loadDomainItems(domainKey, "");
    },
    [loadDomainItems],
  );

  const openMappingDialog = useCallback(
    async (item: KonsultaLibraryDomainItemsData[number]) => {
      setMappingItem(item);
      const initialQuery = item.displayLabel;
      setReferenceQuery(initialQuery);
      const result = await searchPhilHealthKonsultaReferencesAction(
        clinicUid,
        item.domainKey,
        initialQuery,
      );
      if (result.status && result.data) {
        setReferenceOptions(result.data);
      } else {
        setReferenceOptions([]);
        toast.error(
          result.message ??
            "Failed to load PhilHealth references. Please try again or contact support if the issue persists.",
        );
      }
      setSelectedReferenceValue(
        item.mappedReferenceId ? String(item.mappedReferenceId) : "__UNMAPPED__",
      );
    },
    [clinicUid],
  );

  const selectedDomainSummary = useMemo(
    () =>
      selectedDomainKey
        ? librarySummary?.domains.find(
            (domain) => domain.domainKey === selectedDomainKey,
          ) ?? null
        : null,
    [librarySummary?.domains, selectedDomainKey],
  );

  const form = useForm<PhilHealthFormValues>({
    resolver: zodResolver(philhealthSchema),
    defaultValues: {
      philhealthAccreditationNumber: clinicSetting?.philhealthAccreditationNumber ?? "",
      facilityName: clinicSetting?.facilityName ?? "",
      konsultaUsername: clinicSetting?.konsultaUsername ?? "",
      konsultaPassword: clinicSetting?.konsultaPassword ?? "",
      pmccNumber: clinicSetting?.pmccNumber ?? "",
    },
  });

  const onSubmit = (values: PhilHealthFormValues) => {
    startTransition(async () => {
      const result = await updatePhilHealthSettingsAction(clinicUid, {
        philhealthAccreditationNumber: values.philhealthAccreditationNumber || undefined,
        facilityName: values.facilityName || undefined,
        konsultaUsername: values.konsultaUsername || undefined,
        konsultaPassword: values.konsultaPassword || undefined,
        pmccNumber: values.pmccNumber || undefined,
      });

      if (result.status) {
        toast.success("PhilHealth settings saved.");
      } else {
        toast.error(result.message ?? "Failed to save PhilHealth settings.");
      }
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const lines: string[] = [];
    const post = async (action: string, extra?: object) => {
      const res = await fetch("/api/konsulta/test-staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, clinicId: clinicSetting?.clinicId, ...extra }),
      });
      return res.json() as Promise<Record<string, unknown>>;
    };

    try {
      // Step 1 — raw TCP ping
      lines.push("[1/5] Pinging SOAP endpoint…");
      setTestResult(lines.join("\n"));
      const ping = await post("ping");
      if (ping.ok) {
        lines.push(`  ✓ Reachable (HTTP ${(ping.ping as Record<string, unknown>)?.statusCode ?? "?"})`);
      } else {
        lines.push(`  ✗ Unreachable — ${(ping.ping as Record<string, unknown>)?.error ?? "unknown error"}`);
        lines.push("  → Server may be down, behind a firewall, or blocking this IP.");
        setTestResult(lines.join("\n"));
        toast.error("Staging server is unreachable");
        return;
      }

      // Step 2 — WSDL fetch
      lines.push("\n[2/5] Fetching WSDL…");
      setTestResult(lines.join("\n"));
      const describe = await post("describe");
      if (describe.ok) {
        const describeInner = describe.describe as Record<string, unknown>;
        const operations = describeInner?.operations;
        lines.push(`  ✓ WSDL loaded — ${Object.keys(operations as object ?? {}).length} operation(s) available`);
      } else {
        const describeInner = describe.describe as Record<string, unknown>;
        lines.push(`  ✗ WSDL fetch failed — ${describeInner?.error ?? describe.error ?? "unknown"}`);
        setTestResult(lines.join("\n"));
        toast.error("WSDL fetch failed");
        return;
      }

      // Step 3 — getToken
      lines.push("\n[3/5] Getting access token…");
      setTestResult(lines.join("\n"));
      const tokenRes = await post("get-token");
      if (tokenRes.ok) {
        const raw = (tokenRes.result as Record<string, unknown>)?.return as string ?? "";
        let jwt = raw;
        try { jwt = (JSON.parse(raw) as { result?: string }).result ?? raw; } catch { /* plain string */ }
        lines.push(`  ✓ Token: ${jwt.slice(0, 40)}…`);
      } else {
        lines.push(`  ✗ getToken failed — ${tokenRes.error ?? "unknown"}`);
        if (tokenRes.hint) lines.push(`  ℹ ${tokenRes.hint}`);
        setTestResult(lines.join("\n"));
        toast.error("getToken failed");
        return;
      }

      // Step 4 — extractRegistrationList (ERL)
      lines.push("\n[4/5] Extracting registration list (ERL)…");
      setTestResult(lines.join("\n"));
      const erlRes = await post("extract-registration");
      if (erlRes.ok) {
        const m = erlRes.firstMember as Record<string, string> | null;
        if (m?.pAssignedPin) {
          lines.push(`  ✓ Found registered member: PIN ${m.pAssignedPin} (${m.pAssignedType}) — effYear ${m.pEffYear}`);
        } else {
          lines.push("  ✓ ERL succeeded but returned no members — upload test will use Annex B sample PINs");
        }
      } else {
        lines.push(`  ⚠ ERL failed (${erlRes.error ?? "unknown"}) — upload test will use Annex B sample PINs`);
      }

      // Step 5 — upload dummy PCB XML report (validateReport → submitReport)
      lines.push("\n[5/5] Uploading dummy PCB XML report…");
      setTestResult(lines.join("\n"));
      const uploadRes = await post("upload-test", { memberType: "MM" });
      console.log({ uploadRes });
      if (uploadRes.ok) {
        const erlNote = uploadRes.erlNote as string | undefined;
        if (erlNote) lines.push(`  ℹ ${erlNote}`);
        const validateData = uploadRes.validate as Record<string, unknown> | string | null;
        const submitData = uploadRes.submit as Record<string, unknown> | string | null;
        const validateMsg = typeof validateData === "object" && validateData
          ? JSON.stringify(validateData, null, 2).split("\n").map((l, i) => i === 0 ? l : "      " + l).join("\n")
          : String(validateData ?? "");
        const submitMsg = typeof submitData === "object" && submitData
          ? JSON.stringify(submitData, null, 2).split("\n").map((l, i) => i === 0 ? l : "      " + l).join("\n")
          : String(submitData ?? "");
        lines.push(`  ✓ validateReport: ${validateMsg}`);
        lines.push(`  ✓ submitReport:   ${submitMsg}`);
        toast.success("Full staging flow complete — all 5 steps passed");
      } else {
        const errMsg = uploadRes.error as string | undefined;
        const erlNote = uploadRes.erlNote as string | undefined;
        const validateData = uploadRes.validate as Record<string, unknown> | string | null;
        const soapFault = uploadRes.soapFaultBody as string | undefined;
        const rawResp = uploadRes.rawSoapResponse as string | undefined;

        if (erlNote) lines.push(`  ℹ ${erlNote}`);
        if (errMsg) {
          lines.push(`  ✗ Upload failed — ${errMsg}`);
        } else if (typeof validateData === "object" && validateData) {
          lines.push(`  ✗ Validation failed — ${JSON.stringify(validateData)}`);
        } else if (validateData) {
          lines.push(`  ✗ Validation failed — ${String(validateData)}`);
        } else {
          lines.push(`  ✗ Upload failed — no error detail returned`);
        }

        if (uploadRes.hint) lines.push(`  ℹ ${uploadRes.hint}`);
        if (uploadRes.validationErrors) lines.push(`  Validation errors:\n${String(uploadRes.validationErrors)}`);
        if (soapFault) lines.push(`  SOAP fault:\n  ${soapFault.slice(0, 400)}`);
        if (rawResp) lines.push(`  Server response:\n  ${rawResp.slice(0, 600)}`);
        toast.error("Report upload failed");
      }
    } catch (err) {
      lines.push(`\nUnexpected error: ${err instanceof Error ? err.message : String(err)}`);
      toast.error("Connection test failed");
    } finally {
      setTestResult(lines.join("\n"));
      setIsTesting(false);
    }
  };

  const handleBootstrapLibraries = () => {
    startLibraryTransition(async () => {
      const result = await bootstrapClinicKonsultaLibrariesAction(clinicUid);
      if (result.status) {
        toast.success(result.message ?? "Clinic libraries bootstrapped.");
        await refreshLibrarySummary();
        if (selectedDomainKey) {
          await loadDomainItems(selectedDomainKey, domainQuery);
        }
      } else {
        toast.error(result.message ?? "Failed to bootstrap clinic libraries.");
      }
    });
  };

  const handleRefreshDomainItems = () => {
    if (!selectedDomainKey) {
      return;
    }

    startLibraryTransition(async () => {
      await loadDomainItems(selectedDomainKey, domainQuery);
      await refreshLibrarySummary();
    });
  };

  const handleCreateInternalItem = () => {
    if (!selectedDomainKey) {
      return;
    }

    startLibraryTransition(async () => {
      const result = await createClinicKonsultaLibraryItemAction(clinicUid, {
        domainKey: selectedDomainKey,
        internalCode: newItemCode.trim() || undefined,
        displayLabel: newItemLabel,
      });

      if (result.status) {
        toast.success(result.message ?? "Internal library item created.");
        setNewItemCode("");
        setNewItemLabel("");
        await loadDomainItems(selectedDomainKey, domainQuery);
        await refreshLibrarySummary();
      } else {
        toast.error(result.message ?? "Failed to create internal library item.");
      }
    });
  };

  const handleSearchReferences = () => {
    if (!mappingItem) {
      return;
    }

    startLibraryTransition(async () => {
      const result = await searchPhilHealthKonsultaReferencesAction(
        clinicUid,
        mappingItem.domainKey,
        referenceQuery,
      );
      if (result.status && result.data) {
        setReferenceOptions(result.data);
      } else {
        toast.error(result.message ?? "Failed to search references.");
      }
    });
  };

  const handleSaveMapping = () => {
    if (!mappingItem) {
      return;
    }

    startLibraryTransition(async () => {
      const nextReferenceId =
        selectedReferenceValue === "__UNMAPPED__"
          ? null
          : Number(selectedReferenceValue);
      const result = await updateClinicKonsultaLibraryMappingAction(clinicUid, {
        clinicItemId: mappingItem.id,
        philHealthReferenceItemId: nextReferenceId,
      });

      if (result.status) {
        toast.success(result.message ?? "Mapping saved.");
        setMappingItem(null);
        setReferenceOptions([]);
        setSelectedReferenceValue("__UNMAPPED__");
        if (selectedDomainKey) {
          await loadDomainItems(selectedDomainKey, domainQuery);
        }
        await refreshLibrarySummary();
        await loadMappingAuditHistory();
      } else {
        toast.error(result.message ?? "Failed to save mapping.");
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

            <Separator />

            <div>
              <p className="text-sm font-semibold mb-1">Konsulta PKA Credentials</p>
              <p className="text-xs text-muted-foreground mb-4">
                Required for submitting PCB reports to PhilHealth via the Konsulta v1.1 SOAP API.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="konsultaUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konsulta Username</FormLabel>
                      <FormControl>
                        <Input placeholder="PhilHealth-issued username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="konsultaPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konsulta Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="PhilHealth-issued password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pmccNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PMCC Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Z15445" {...field} />
                      </FormControl>
                      <FormDescription>Primary care clinic code assigned by PhilHealth.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Konsulta Staging Connection Test
            </CardTitle>
            <CardDescription>
              Verify that the saved credentials can reach the PhilHealth Konsulta staging server.
              Save your credentials first before running this test.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isTesting}
                onClick={handleTestConnection}
              >
                {isTesting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Testing…</>
                ) : (
                  "Test Staging Connection"
                )}
              </Button>
            </div>
            {testResult && (
              <pre className="rounded bg-muted p-3 text-xs whitespace-pre-wrap break-all max-h-72 overflow-y-auto">
                {testResult}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Konsulta Library Bootstrap &amp; Mapping
                </CardTitle>
                <CardDescription>
                  Clinic-owned internal libraries are bootstrapped from the bundled
                  PhilHealth reference kit, then mapped back to PhilHealth values for
                  export-safe XML generation.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isLibraryPending}
                onClick={handleBootstrapLibraries}
              >
                {isLibraryPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bootstrapping…
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Bootstrap Internal Libraries
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  PhilHealth references
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {librarySummary?.totals.philHealthReferenceCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Clinic items
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {librarySummary?.totals.clinicItemCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Mapped
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {librarySummary?.totals.mappedCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Needs work
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {(librarySummary?.totals.unmappedCount ?? 0) +
                    (librarySummary?.totals.needsReviewCount ?? 0)}
                </p>
              </div>
            </div>

            {(librarySummary?.totals.missingDomains ?? 0) > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Some Konsulta domains still need bootstrap</AlertTitle>
                <AlertDescription>
                  Use the bootstrap button to create clinic-owned internal libraries
                  first, then review mappings before relying on those domains for
                  export.
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    Recent Konsulta mapping activity
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Audit trail for internal term to PhilHealth reference mapping changes.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void loadMappingAuditHistory()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              {mappingAuditError ? (
                <p className="text-xs text-muted-foreground">{mappingAuditError}</p>
              ) : mappingAuditHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No mapping changes have been audited yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {mappingAuditHistory.map((log) => {
                    const metadata =
                      log.metadata && typeof log.metadata === "object"
                        ? (log.metadata as {
                            clinicItemLabel?: string;
                            domainKey?: string;
                          })
                        : null;

                    return (
                      <div
                        key={log.id}
                        className="rounded-md border border-border/70 bg-muted/20 p-3"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm font-medium">
                            {metadata?.clinicItemLabel ?? log.reason ?? "Mapping updated"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.performedAt).toLocaleString("en-PH")} ·{" "}
                            {log.performerName}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          {metadata?.domainKey && (
                            <Badge variant="outline">{metadata.domainKey}</Badge>
                          )}
                          <span className="text-muted-foreground">
                            {log.previousValue ?? "Unmapped"}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {log.newValue ?? "Unmapped"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Refs</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Mapped</TableHead>
                    <TableHead>Unmapped</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(librarySummary?.domains ?? []).map((domain) => (
                    <TableRow key={domain.domainKey}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{domain.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {domain.domainKey}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{domain.philHealthReferenceCount}</TableCell>
                      <TableCell>{domain.clinicItemCount}</TableCell>
                      <TableCell>{domain.mappedCount}</TableCell>
                      <TableCell>
                        {domain.unmappedCount + domain.needsReviewCount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            domain.bootstrapStatus === "READY"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {domain.bootstrapStatus === "READY"
                            ? "Ready"
                            : "Missing"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openDomainDialog(domain.domainKey, domain.title)
                          }
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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

        <Dialog
          open={isDomainDialogOpen}
          onOpenChange={(open) => {
            setIsDomainDialogOpen(open);
            if (!open) {
              setDomainItems([]);
              setSelectedDomainKey(null);
              setSelectedDomainTitle("");
            }
          }}
        >
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>{selectedDomainTitle || "Konsulta domain"}</DialogTitle>
              <DialogDescription>
                Review clinic-owned internal items, add custom values, and inspect
                current PhilHealth mapping status for this domain.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[2fr,auto]">
                <div className="flex gap-2">
                  <Input
                    value={domainQuery}
                    onChange={(event) => setDomainQuery(event.target.value)}
                    placeholder="Search internal code or label"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRefreshDomainItems}
                    disabled={!selectedDomainKey || isLibraryPending}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Badge variant="secondary">
                    {selectedDomainSummary?.mappedCount ?? 0} mapped
                  </Badge>
                  <Badge variant="outline">
                    {(selectedDomainSummary?.unmappedCount ?? 0) +
                      (selectedDomainSummary?.needsReviewCount ?? 0)}{" "}
                    pending
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr,1fr,auto]">
                <Input
                  value={newItemCode}
                  onChange={(event) => setNewItemCode(event.target.value)}
                  placeholder="Optional internal code"
                />
                <Input
                  value={newItemLabel}
                  onChange={(event) => setNewItemLabel(event.target.value)}
                  placeholder="New clinic-only internal label"
                />
                <Button
                  type="button"
                  onClick={handleCreateInternalItem}
                  disabled={!selectedDomainKey || !newItemLabel.trim() || isLibraryPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add internal item
                </Button>
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Internal item</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Mapping</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingDomainItems ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Loading internal items…
                        </TableCell>
                      </TableRow>
                    ) : domainItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No internal items found for this domain.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domainItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{item.displayLabel}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.internalCode ?? "No internal code"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.sourceType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge
                                variant={
                                  item.mappingStatus === "MAPPED"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {item.mappingStatus}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {item.mappedReferenceCode
                                  ? `${item.mappedReferenceCode} — ${item.mappedReferenceLabel}`
                                  : "No PhilHealth reference assigned"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openMappingDialog(item)}
                            >
                              {item.mappingStatus === "MAPPED" ? "Remap" : "Map"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={mappingItem !== null}
          onOpenChange={(open) => {
            if (!open) {
              setMappingItem(null);
              setReferenceOptions([]);
              setSelectedReferenceValue("__UNMAPPED__");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Map to PhilHealth reference</DialogTitle>
              <DialogDescription>
                {mappingItem
                  ? `Choose the PhilHealth-compliant reference for "${mappingItem.displayLabel}".`
                  : "Choose a PhilHealth reference."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={referenceQuery}
                  onChange={(event) => setReferenceQuery(event.target.value)}
                  placeholder="Search PhilHealth code or label"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchReferences}
                  disabled={!mappingItem || isLibraryPending}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>

              <Select
                value={selectedReferenceValue}
                onValueChange={setSelectedReferenceValue}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a PhilHealth reference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__UNMAPPED__">
                    Leave unmapped
                  </SelectItem>
                  {referenceOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.externalCode
                        ? `${option.externalCode} — ${option.displayLabel}`
                        : option.displayLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMappingItem(null);
                  setReferenceOptions([]);
                  setSelectedReferenceValue("__UNMAPPED__");
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveMapping} disabled={isLibraryPending}>
                Save mapping
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Members Tab helpers                                                */
/* ─────────────────────────────────────────────────────────────────── */

function getInitials(firstName?: string | null, lastName?: string | null) {
  return ((firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "")).toUpperCase() || "?";
}

function isOwner(roleName: string) {
  return roleName.toLowerCase() === "owner";
}

/* ── Add Member Dialog ─────────────────────────────────────────────── */

interface AddMemberDialogProps {
  clinicUid: string;
  roles: RolesData;
  onAdded: (member: MembersData[number]) => void;
}

function AddMemberDialog({ clinicUid, roles, onAdded }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const DROPDOWN_CLOSE_DELAY = 150;

  const searchUsers = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!q || q.trim().length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await searchNonMembersAction(clinicUid, q);
          setResults(res.data ?? []);
          setShowDropdown(true);
        } finally {
          setIsSearching(false);
        }
      }, 350);
    },
    [clinicUid],
  );

  const reset = () => {
    setQuery("");
    setResults([]);
    setSelectedUser(null);
    setSelectedRoleId("");
    setShowDropdown(false);
  };

  const handleAdd = () => {
    if (!selectedUser || !selectedRoleId) return;
    startTransition(async () => {
      const result = await addClinicMemberAction({
        clinicUid,
        userId: selectedUser.userId,
        roleId: Number(selectedRoleId),
      });
      if (result.status) {
        toast.success("Member added successfully.");
        // Build a local member object so the list updates without a reload
        const role = roles.find(r => r.id === Number(selectedRoleId));
        const newMember: MembersData[number] = {
          id: Date.now(), // temporary; server will have real id on next load
          createdAt: new Date(),
          status: "ACTIVE",
          roleId: Number(selectedRoleId),
          Role: { name: role?.name ?? "Member" },
          User: {
            userId: selectedUser.userId,
            email: selectedUser.email,
            firstName: selectedUser.firstName,
            lastName: selectedUser.lastName,
            middleName: selectedUser.middleName,
            suffix: null,
            picture: selectedUser.picture,
          },
          ClinicMemberPermissions: [],
        };
        onAdded(newMember);
        reset();
        setOpen(false);
      } else {
        toast.error(result.message ?? "Failed to add member.");
      }
    });
  };

  const nonOwnerRoles = roles.filter(r => !isOwner(r.name));

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <UserPlus className="h-4 w-4" />
        Add Member
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Clinic Member</DialogTitle>
            <DialogDescription>
              Search for a registered user and assign them a role. Initial permissions will be applied automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* User search */}
            <div className="space-y-1.5">
              <Label>Search User</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-8"
                  placeholder="Name or email…"
                  value={selectedUser
                    ? [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ") || selectedUser.email
                    : query}
                  onChange={(e) => {
                    if (selectedUser) setSelectedUser(null);
                    setQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), DROPDOWN_CLOSE_DELAY)}
                />
                {isSearching && (
                  <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {showDropdown && results.length > 0 && !selectedUser && (
                <div className="rounded-md border bg-popover shadow-md z-50 max-h-44 overflow-y-auto">
                  {results.map((u) => (
                    <button
                      key={u.userId}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent text-sm"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedUser(u);
                        setShowDropdown(false);
                        setQuery("");
                      }}
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={u.picture ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(u.firstName, u.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && results.length === 0 && !isSearching && query.length >= 2 && (
                <p className="text-xs text-muted-foreground pl-1">No users found.</p>
              )}

              {selectedUser && (
                <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={selectedUser.picture ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(selectedUser.firstName, selectedUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ") || selectedUser.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => { setSelectedUser(null); setQuery(""); }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Role select — owner excluded */}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role…" />
                </SelectTrigger>
                <SelectContent>
                  {nonOwnerRoles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The owner role cannot be assigned here. Initial permissions for the selected role will be applied automatically.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedUser || !selectedRoleId || isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── Change Role + Permission Mode Dialog ─────────────────────────── */

interface ChangeRoleDialogProps {
  member: MembersData[number];
  roles: RolesData;
  onChanged: (memberId: number, newRoleId: number, newRoleName: string) => void;
}

function ChangeRoleDialog({ member, roles, onChanged }: ChangeRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [newRoleId, setNewRoleId] = useState<string>("");
  const [permMode, setPermMode] = useState<"replace" | "merge">("replace");
  const [isPending, startTransition] = useTransition();

  const nonOwnerRoles = roles.filter(r => !isOwner(r.name));

  const handleConfirm = () => {
    if (!newRoleId) return;
    startTransition(async () => {
      const result = await updateClinicMemberRoleAction(member.id, Number(newRoleId), permMode);
      if (result.status) {
        const role = roles.find(r => r.id === Number(newRoleId));
        toast.success(result.message ?? "Role updated.");
        onChanged(member.id, Number(newRoleId), role?.name ?? "");
        setOpen(false);
        setNewRoleId("");
        setPermMode("replace");
      } else {
        toast.error(result.message ?? "Failed to update role.");
      }
    });
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => { e.preventDefault(); setOpen(true); }}
        className="gap-2"
      >
        <ShieldCheck className="h-4 w-4" />
        Change Role
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setNewRoleId(""); setPermMode("replace"); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Select a new role for{" "}
              <span className="font-medium">
                {[member.User.firstName, member.User.lastName].filter(Boolean).join(" ") || member.User.email}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>New Role</Label>
              <Select value={newRoleId} onValueChange={setNewRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role…" />
                </SelectTrigger>
                <SelectContent>
                  {nonOwnerRoles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)} disabled={r.id === member.roleId}>
                      {r.name}{r.id === member.roleId ? " (current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Permission Update Mode</Label>
              <RadioGroup
                value={permMode}
                onValueChange={(v) => setPermMode(v as "replace" | "merge")}
                className="space-y-2"
              >
                <div className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50"
                     onClick={() => setPermMode("replace")}>
                  <RadioGroupItem value="replace" id="replace" className="mt-0.5" />
                  <div>
                    <Label htmlFor="replace" className="font-medium cursor-pointer flex items-center gap-1.5">
                      <ShieldX className="h-3.5 w-3.5 text-destructive" />
                      Replace
                      <Badge variant="secondary" className="text-xs ml-1">Default</Badge>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Remove all existing permissions and apply only the new role&apos;s initial permissions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50"
                     onClick={() => setPermMode("merge")}>
                  <RadioGroupItem value="merge" id="merge" className="mt-0.5" />
                  <div>
                    <Label htmlFor="merge" className="font-medium cursor-pointer flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Merge
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Keep all existing permissions and additionally grant the new role&apos;s initial permissions.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!newRoleId || isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Member Permissions Dialog                                          */
/* ─────────────────────────────────────────────────────────────────── */

interface MemberPermissionsDialogProps {
  clinicUid: string;
  member: MembersData[number];
  allPermissions: PermissionsData;
  onSaved: (memberId: number, permissionIds: number[]) => void;
}

function MemberPermissionsDialog({ clinicUid, member, allPermissions, onSaved }: MemberPermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(member.ClinicMemberPermissions.map(p => p.permissionId))
  );
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setSelectedIds(new Set(member.ClinicMemberPermissions.map(p => p.permissionId)));
    setOpen(true);
  };

  const toggle = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await setClinicMemberPermissionsAction({
        clinicUid,
        userId: member.User.userId,
        permissionIds: Array.from(selectedIds),
      });
      if (result.status) {
        toast.success("Permissions updated.");
        onSaved(member.id, Array.from(selectedIds));
        setOpen(false);
      } else {
        toast.error(result.message ?? "Failed to update permissions.");
      }
    });
  };

  const memberName = [member.User.firstName, member.User.lastName].filter(Boolean).join(" ") || member.User.email;

  return (
    <>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpen(); }} className="gap-2">
        <Shield className="h-4 w-4" />
        Manage Permissions
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Individual permissions for <span className="font-medium">{memberName}</span>.
              These are independent of the role and persist unless replaced during a role change.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[360px] pr-3">
            <div className="space-y-1.5 py-2">
              {allPermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No clinic permissions available.</p>
              ) : (
                allPermissions.map(perm => (
                  <div
                    key={perm.id}
                    className="flex items-start gap-3 rounded-md p-2.5 hover:bg-accent/50 cursor-pointer"
                    onClick={() => toggle(perm.id)}
                  >
                    <Checkbox
                      id={`perm-${perm.id}-${member.id}`}
                      checked={selectedIds.has(perm.id)}
                      onCheckedChange={() => toggle(perm.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`perm-${perm.id}-${member.id}`}
                        className="text-sm font-medium cursor-pointer"
                        onClick={e => e.stopPropagation()}
                      >
                        {perm.name}
                      </label>
                      {perm.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">{selectedIds.size} of {allPermissions.length} selected</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Restore Default Permissions Dialog (Clinic)                        */
/* ─────────────────────────────────────────────────────────────────── */

interface RestoreDefaultPermissionsDialogProps {
  member: MembersData[number];
  onRestored: (memberId: number, permissionIds: number[]) => void;
}

function RestoreDefaultPermissionsDialog({ member, onRestored }: RestoreDefaultPermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const memberName = [member.User.firstName, member.User.lastName].filter(Boolean).join(" ") || member.User.email;

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await resetClinicMemberPermissionsAction(member.id);
      if (result.status) {
        toast.success(result.message ?? "Permissions restored to defaults.");
        onRestored(member.id, result.data ?? []);
        setOpen(false);
      } else {
        toast.error(result.message ?? "Failed to restore permissions.");
      }
    });
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => { e.preventDefault(); setOpen(true); }}
        className="gap-2"
      >
        <ShieldX className="h-4 w-4" />
        Restore Default Permissions
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Restore Default Permissions
            </DialogTitle>
            <DialogDescription>
              This will reset all permissions for{" "}
              <span className="font-medium text-foreground">{memberName}</span>{" "}
              back to the default permissions of their current role (
              <span className="font-medium text-foreground">{member.Role.name}</span>
              ).
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              Warning
            </p>
            <p>
              Any custom permission changes made to this member will be permanently lost and replaced with the role&apos;s default permissions. This action cannot be undone.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Restore Defaults
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Appointment Modes                                             */
/* ─────────────────────────────────────────────────────────────────── */

function AppointmentModesTab({
  clinicUid,
  initialModes,
}: {
  clinicUid: string;
  initialModes: AppointmentModesData;
}) {
  const [modes, setModes] = useState(initialModes);
  const [editingMode, setEditingMode] = useState<AppointmentModesData[number] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createAppointmentModeAction({ clinicUid, name: newName.trim(), description: newDescription || undefined });
      if (result.status && result.data) {
        setModes(prev => [...prev, result.data!]);
        setShowCreate(false);
        setNewName(""); setNewDescription("");
        toast.success("Appointment mode created.");
      } else {
        toast.error(result.message ?? "Failed to create mode.");
      }
    });
  };

  const handleUpdate = () => {
    if (!editingMode || !editName.trim()) return;
    startTransition(async () => {
      const result = await updateAppointmentModeAction({ id: editingMode.id, name: editName.trim(), description: editDescription || undefined });
      if (result.status) {
        setModes(prev => prev.map(m => m.id === editingMode.id ? { ...m, name: editName.trim(), description: editDescription || null } : m));
        setEditingMode(null);
        toast.success("Appointment mode updated.");
      } else {
        toast.error(result.message ?? "Failed to update mode.");
      }
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteAppointmentModeAction(id);
      if (result.status) {
        setModes(prev => prev.filter(m => m.id !== id));
        toast.success("Appointment mode deleted.");
      } else {
        toast.error(result.message ?? "Failed to delete mode.");
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Appointment Modes
              </CardTitle>
              <CardDescription className="mt-1">
                Define how appointments can be conducted (e.g. In-person, Online, Home visit).
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Mode
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {modes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Globe className="h-9 w-9 mb-3 opacity-30" />
              <p className="text-sm">No appointment modes configured yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {modes.map(mode => (
                <div key={mode.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{mode.name}</p>
                    {mode.description && <p className="text-xs text-muted-foreground truncate">{mode.description}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingMode(mode); setEditName(mode.name); setEditDescription(mode.description ?? ""); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" disabled={deletingId === mode.id} onClick={() => handleDelete(mode.id)}>
                      {deletingId === mode.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) { setNewName(""); setNewDescription(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Appointment Mode</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-destructive">*</span></Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. In-person" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Optional description" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMode} onOpenChange={v => { if (!v) setEditingMode(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Appointment Mode</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-destructive">*</span></Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={editDescription} onChange={e => setEditDescription(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMode(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!editName.trim() || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Appointment Types                                             */
/* ─────────────────────────────────────────────────────────────────── */

function AppointmentTypesTab({
  clinicUid,
  initialTypes,
}: {
  clinicUid: string;
  initialTypes: AppointmentTypesData;
}) {
  const [types, setTypes] = useState(initialTypes);
  const [editingType, setEditingType] = useState<AppointmentTypesData[number] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDuration, setNewDuration] = useState("30");
  const [newPadding, setNewPadding] = useState("5");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDuration, setEditDuration] = useState("30");
  const [editPadding, setEditPadding] = useState("0");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createAppointmentTypeAction({
        clinicUid,
        name: newName.trim(),
        description: newDescription || undefined,
        duration: Number(newDuration),
        durationPadding: Number(newPadding),
      });
      if (result.status) {
        setTypes(prev => [...prev, { id: Date.now(), name: newName.trim(), description: newDescription || null, AppointmentTypeAttribute: { id: Date.now(), duration: Number(newDuration), durationPadding: Number(newPadding), reminders: [], requirements: [] } }]);
        setShowCreate(false);
        setNewName(""); setNewDescription(""); setNewDuration("30"); setNewPadding("5");
        toast.success("Appointment type created.");
      } else {
        toast.error(result.message ?? "Failed to create type.");
      }
    });
  };

  const handleUpdate = () => {
    if (!editingType || !editName.trim()) return;
    startTransition(async () => {
      const result = await updateAppointmentTypeAction({
        id: editingType.id,
        name: editName.trim(),
        description: editDescription || undefined,
        duration: Number(editDuration),
        durationPadding: Number(editPadding),
      });
      if (result.status) {
        setTypes(prev => prev.map(t => t.id === editingType.id ? {
          ...t,
          name: editName.trim(),
          description: editDescription || null,
          AppointmentTypeAttribute: t.AppointmentTypeAttribute
            ? { ...t.AppointmentTypeAttribute, duration: Number(editDuration), durationPadding: Number(editPadding) }
            : null,
        } : t));
        setEditingType(null);
        toast.success("Appointment type updated.");
      } else {
        toast.error(result.message ?? "Failed to update type.");
      }
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteAppointmentTypeAction(id);
      if (result.status) {
        setTypes(prev => prev.filter(t => t.id !== id));
        toast.success("Appointment type deleted.");
      } else {
        toast.error(result.message ?? "Failed to delete type.");
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Appointment Types
              </CardTitle>
              <CardDescription className="mt-1">
                Define appointment types and their default durations (e.g. Consultation, Follow-up).
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Layers className="h-9 w-9 mb-3 opacity-30" />
              <p className="text-sm">No appointment types configured yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {types.map(type => (
                <div key={type.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{type.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      {type.AppointmentTypeAttribute && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {type.AppointmentTypeAttribute.duration}min
                          {type.AppointmentTypeAttribute.durationPadding > 0 && ` + ${type.AppointmentTypeAttribute.durationPadding}min padding`}
                        </span>
                      )}
                      {type.description && <span className="text-xs text-muted-foreground truncate">{type.description}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                      setEditingType(type);
                      setEditName(type.name);
                      setEditDescription(type.description ?? "");
                      setEditDuration(String(type.AppointmentTypeAttribute?.duration ?? 30));
                      setEditPadding(String(type.AppointmentTypeAttribute?.durationPadding ?? 0));
                    }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" disabled={deletingId === type.id} onClick={() => handleDelete(type.id)}>
                      {deletingId === type.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) { setNewName(""); setNewDescription(""); setNewDuration("30"); setNewPadding("5"); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Appointment Type</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-destructive">*</span></Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Initial Consultation" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Optional description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" min={1} value={newDuration} onChange={e => setNewDuration(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Padding (min)</Label><Input type="number" min={0} value={newPadding} onChange={e => setNewPadding(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingType} onOpenChange={v => { if (!v) setEditingType(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Appointment Type</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-destructive">*</span></Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={editDescription} onChange={e => setEditDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" min={1} value={editDuration} onChange={e => setEditDuration(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Padding (min)</Label><Input type="number" min={0} value={editPadding} onChange={e => setEditPadding(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingType(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!editName.trim() || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Services                                                      */
/* ─────────────────────────────────────────────────────────────────── */

function ServicesTab({
  clinicUid,
  initialCategories,
}: {
  clinicUid: string;
  initialCategories: ServiceCategoriesData;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategory, setEditingCategory] = useState<ServiceCategoriesData[number] | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [editCatName, setEditCatName] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");
  const [editingService, setEditingService] = useState<{ categoryId: number; service: ServiceCategoriesData[number]["Services"][number] } | null>(null);
  const [showCreateService, setShowCreateService] = useState<number | null>(null);
  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcDesc, setNewSvcDesc] = useState("");
  const [newSvcDuration, setNewSvcDuration] = useState("30");
  const [newSvcPadding, setNewSvcPadding] = useState("0");
  const [editSvcName, setEditSvcName] = useState("");
  const [editSvcDesc, setEditSvcDesc] = useState("");
  const [editSvcDuration, setEditSvcDuration] = useState("30");
  const [editSvcPadding, setEditSvcPadding] = useState("0");
  const [isPending, startTransition] = useTransition();
  const [deletingCatId, setDeletingCatId] = useState<number | null>(null);
  const [deletingSvcId, setDeletingSvcId] = useState<number | null>(null);

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    startTransition(async () => {
      const result = await createClinicServiceCategoryAction({ clinicUid, name: newCatName.trim(), description: newCatDesc || undefined });
      if (result.status) {
        setCategories(prev => [...prev, { id: Date.now(), name: newCatName.trim(), description: newCatDesc || null, Services: [] }]);
        setShowCreateCategory(false);
        setNewCatName(""); setNewCatDesc("");
        toast.success("Category created.");
      } else {
        toast.error(result.message ?? "Failed to create category.");
      }
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editCatName.trim()) return;
    startTransition(async () => {
      const result = await updateClinicServiceCategoryAction({ id: editingCategory.id, name: editCatName.trim(), description: editCatDesc || undefined });
      if (result.status) {
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: editCatName.trim(), description: editCatDesc || null } : c));
        setEditingCategory(null);
        toast.success("Category updated.");
      } else {
        toast.error(result.message ?? "Failed to update category.");
      }
    });
  };

  const handleDeleteCategory = (id: number) => {
    setDeletingCatId(id);
    startTransition(async () => {
      const result = await deleteServiceCategoryAction(id);
      if (result.status) {
        setCategories(prev => prev.filter(c => c.id !== id));
        toast.success("Category deleted.");
      } else {
        toast.error(result.message ?? "Failed to delete category.");
      }
      setDeletingCatId(null);
    });
  };

  const handleCreateService = (categoryId: number) => {
    if (!newSvcName.trim()) return;
    startTransition(async () => {
      const result = await createClinicServiceAction({ name: newSvcName.trim(), description: newSvcDesc, duration: Number(newSvcDuration), durationPadding: Number(newSvcPadding), categoryId });
      if (result.status) {
        setCategories(prev => prev.map(c => c.id === categoryId ? {
          ...c,
          Services: [...c.Services, { id: Date.now(), name: newSvcName.trim(), ServiceAttribute: { duration: Number(newSvcDuration), durationPadding: Number(newSvcPadding), reminders: [], requirements: [] } }]
        } : c));
        setShowCreateService(null);
        setNewSvcName(""); setNewSvcDesc(""); setNewSvcDuration("30"); setNewSvcPadding("0");
        toast.success("Service created.");
      } else {
        toast.error(result.message ?? "Failed to create service.");
      }
    });
  };

  const handleUpdateService = () => {
    if (!editingService || !editSvcName.trim()) return;
    startTransition(async () => {
      const result = await updateClinicServiceAction({ id: editingService.service.id, name: editSvcName.trim(), description: editSvcDesc, duration: Number(editSvcDuration), durationPadding: Number(editSvcPadding) });
      if (result.status) {
        setCategories(prev => prev.map(c => c.id === editingService.categoryId ? {
          ...c,
          Services: c.Services.map(s => s.id === editingService.service.id ? {
            ...s,
            name: editSvcName.trim(),
            ServiceAttribute: s.ServiceAttribute ? { ...s.ServiceAttribute, duration: Number(editSvcDuration), durationPadding: Number(editSvcPadding) } : null
          } : s)
        } : c));
        setEditingService(null);
        toast.success("Service updated.");
      } else {
        toast.error(result.message ?? "Failed to update service.");
      }
    });
  };

  const handleDeleteService = (categoryId: number, serviceId: number) => {
    setDeletingSvcId(serviceId);
    startTransition(async () => {
      const result = await deleteClinicServiceAction(serviceId);
      if (result.status) {
        setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, Services: c.Services.filter(s => s.id !== serviceId) } : c));
        toast.success("Service deleted.");
      } else {
        toast.error(result.message ?? "Failed to delete service.");
      }
      setDeletingSvcId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreateCategory(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No service categories configured yet.</p>
          </CardContent>
        </Card>
      ) : (
        categories.map(cat => (
          <Card key={cat.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    {cat.name}
                  </CardTitle>
                  {cat.description && <CardDescription className="mt-0.5 text-xs">{cat.description}</CardDescription>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Add service" onClick={() => { setShowCreateService(cat.id); setNewSvcName(""); setNewSvcDesc(""); setNewSvcDuration("30"); setNewSvcPadding("0"); }}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingCategory(cat); setEditCatName(cat.name); setEditCatDesc(cat.description ?? ""); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" disabled={deletingCatId === cat.id} onClick={() => handleDeleteCategory(cat.id)}>
                    {deletingCatId === cat.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              {cat.Services.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-1">No services in this category.</p>
              ) : (
                cat.Services.map(svc => (
                  <div key={svc.id} className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">{svc.name}</span>
                      {svc.ServiceAttribute && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          <Clock className="inline h-3 w-3 mr-0.5" />
                          {svc.ServiceAttribute.duration}min
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                        setEditingService({ categoryId: cat.id, service: svc });
                        setEditSvcName(svc.name);
                        setEditSvcDesc("");
                        setEditSvcDuration(String(svc.ServiceAttribute?.duration ?? 30));
                        setEditSvcPadding(String(svc.ServiceAttribute?.durationPadding ?? 0));
                      }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" disabled={deletingSvcId === svc.id} onClick={() => handleDeleteService(cat.id, svc.id)}>
                        {deletingSvcId === svc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Create Category */}
      <Dialog open={showCreateCategory} onOpenChange={v => { setShowCreateCategory(v); if (!v) { setNewCatName(""); setNewCatDesc(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Service Category</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-destructive">*</span></Label><Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. General Consultation" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="Optional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCategory(false)}>Cancel</Button>
            <Button onClick={handleCreateCategory} disabled={!newCatName.trim() || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category */}
      <Dialog open={!!editingCategory} onOpenChange={v => { if (!v) setEditingCategory(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-destructive">*</span></Label><Input value={editCatName} onChange={e => setEditCatName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={editCatDesc} onChange={e => setEditCatDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
            <Button onClick={handleUpdateCategory} disabled={!editCatName.trim() || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Service */}
      <Dialog open={showCreateService !== null} onOpenChange={v => { if (!v) setShowCreateService(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-destructive">*</span></Label><Input value={newSvcName} onChange={e => setNewSvcName(e.target.value)} placeholder="e.g. Blood Pressure Check" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={newSvcDesc} onChange={e => setNewSvcDesc(e.target.value)} placeholder="Optional" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" min={1} value={newSvcDuration} onChange={e => setNewSvcDuration(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Padding (min)</Label><Input type="number" min={0} value={newSvcPadding} onChange={e => setNewSvcPadding(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateService(null)}>Cancel</Button>
            <Button onClick={() => showCreateService !== null && handleCreateService(showCreateService)} disabled={!newSvcName.trim() || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service */}
      <Dialog open={!!editingService} onOpenChange={v => { if (!v) setEditingService(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Service</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-destructive">*</span></Label><Input value={editSvcName} onChange={e => setEditSvcName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={editSvcDesc} onChange={e => setEditSvcDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" min={1} value={editSvcDuration} onChange={e => setEditSvcDuration(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Padding (min)</Label><Input type="number" min={0} value={editSvcPadding} onChange={e => setEditSvcPadding(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingService(null)}>Cancel</Button>
            <Button onClick={handleUpdateService} disabled={!editSvcName.trim() || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Systems                                                       */
/* ─────────────────────────────────────────────────────────────────── */

function SystemsTab({
  clinicUid,
  initialSystems,
}: {
  clinicUid: string;
  initialSystems: SystemsData;
}) {
  const [systems, setSystems] = useState(initialSystems);
  const [editingSystem, setEditingSystem] = useState<SystemsData[number] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createSystemAction({ clinicUid, name: newName.trim() });
      if (result.status && result.data) {
        setSystems(prev => [...prev, result.data]);
        setShowCreate(false);
        setNewName("");
        toast.success("System created.");
      } else {
        toast.error(result.message ?? "Failed to create system.");
      }
    });
  };

  const handleUpdate = () => {
    if (!editingSystem || !editName.trim()) return;
    startTransition(async () => {
      const result = await updateSystemAction({ id: editingSystem.id, name: editName.trim() });
      if (result.status) {
        setSystems(prev => prev.map(s => s.id === editingSystem.id ? { ...s, name: editName.trim() } : s));
        setEditingSystem(null);
        toast.success("System updated.");
      } else {
        toast.error(result.message ?? "Failed to update system.");
      }
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteSystemAction(id);
      if (result.status) {
        setSystems(prev => prev.filter(s => s.id !== id));
        toast.success("System deleted.");
      } else {
        toast.error(result.message ?? "Failed to delete system.");
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Systems / Departments
              </CardTitle>
              <CardDescription className="mt-1">
                Define the systems or departments used to categorize consultations and appointments (e.g. Cardiology, Pediatrics).
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add System
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {systems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Zap className="h-9 w-9 mb-3 opacity-30" />
              <p className="text-sm">No systems configured yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {systems.map(system => (
                <div key={system.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{system.name}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingSystem(system); setEditName(system.name); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" disabled={deletingId === system.id} onClick={() => handleDelete(system.id)}>
                      {deletingId === system.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) setNewName(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add System</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-destructive">*</span></Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Cardiology, Pediatrics" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSystem} onOpenChange={v => { if (!v) setEditingSystem(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit System</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-destructive">*</span></Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSystem(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!editName.trim() || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Members                                                       */
/* ─────────────────────────────────────────────────────────────────── */

function MembersTab({
  clinicUid,
  initialMembers,
  roles,
  allPermissions,
}: {
  clinicUid: string;
  initialMembers: MembersData;
  roles: RolesData;
  allPermissions: PermissionsData;
}) {
  const [members, setMembers] = useState<MembersData>(initialMembers);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const statusVariant = (status: string): "default" | "secondary" | "outline" => {
    if (status === "ACTIVE") return "default";
    if (status === "PENDING") return "secondary";
    return "outline";
  };

  const handleAdded = (member: MembersData[number]) => {
    setMembers(prev => [...prev, member]);
  };

  const handleRoleChanged = (memberId: number, newRoleId: number, newRoleName: string) => {
    setMembers(prev =>
      prev.map(m =>
        m.id === memberId ? { ...m, roleId: newRoleId, Role: { name: newRoleName } } : m,
      ),
    );
  };

  const handlePermissionsSaved = (memberId: number, permissionIds: number[]) => {
    setMembers(prev =>
      prev.map(m =>
        m.id === memberId ? { ...m, ClinicMemberPermissions: permissionIds.map(id => ({ permissionId: id })) } : m,
      ),
    );
  };

  const handleRemove = (memberId: number) => {
    setRemovingId(memberId);
    const doRemove = async () => {
      const result = await removeClinicMemberAction(memberId);
      if (result.status) {
        toast.success("Member removed.");
        setMembers(prev => prev.filter(m => m.id !== memberId));
      } else {
        toast.error(result.message ?? "Failed to remove member.");
      }
      setRemovingId(null);
    };
    doRemove();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Clinic Members
              </CardTitle>
              <CardDescription className="mt-1">
                Manage who has access to this clinic. Each member can have unique permissions independent of their role.
              </CardDescription>
            </div>
            <AddMemberDialog clinicUid={clinicUid} roles={roles} onAdded={handleAdded} />
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No members found for this clinic.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const memberIsOwner = isOwner(member.Role.name);
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">{member.User.email}</p>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Shield className="h-3 w-3" />
                          {member.ClinicMemberPermissions.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {memberIsOwner ? (
                        <Badge className="gap-1 text-xs bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-300">
                          <Crown className="h-3 w-3" />
                          Owner
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {member.Role.name}
                        </Badge>
                      )}
                      <Badge variant={statusVariant(member.status)} className="text-xs">
                        {member.status === "ACTIVE" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {member.status}
                      </Badge>

                      {/* Actions — hidden for owner */}
                      {!memberIsOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate max-w-44">
                              {[member.User.firstName, member.User.lastName].filter(Boolean).join(" ") || member.User.email}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ChangeRoleDialog
                              member={member}
                              roles={roles}
                              onChanged={handleRoleChanged}
                            />
                            <MemberPermissionsDialog
                              clinicUid={clinicUid}
                              member={member}
                              allPermissions={allPermissions}
                              onSaved={handlePermissionsSaved}
                            />
                            <RestoreDefaultPermissionsDialog
                              member={member}
                              onRestored={handlePermissionsSaved}
                            />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive gap-2 focus:text-destructive"
                              disabled={removingId === member.id}
                              onSelect={() => handleRemove(member.id)}
                            >
                              {removingId === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Roles                                                         */
/* ─────────────────────────────────────────────────────────────────── */

type RoleWithPerms = RolesWithPermissionsData[number];

function RolePermissionsSection({
  role,
  clinicUid,
  allPermissions,
}: {
  role: RoleWithPerms;
  clinicUid: string;
  allPermissions: PermissionsData;
}) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<number[]>(
    role.ClinicRoleInitialPermissions.map((rp) => rp.Permission.id),
  );

  const isDirty =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify(
      role.ClinicRoleInitialPermissions.map((rp) => rp.Permission.id).sort(),
    );

  const toggle = (id: number, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );

  const handleSave = () => {
    startTransition(async () => {
      const result = await setClinicRoleInitialPermissionsAction({
        clinicRoleId: role.id,
        clinicUid,
        permissionIds: selected,
      });
      if (result.status) {
        toast.success("Initial permissions saved.");
      } else {
        toast.error(result.message ?? "Failed to save permissions.");
      }
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        These permissions are automatically granted when a member is assigned this role.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {allPermissions.map((perm) => (
          <label
            key={perm.id}
            className="flex items-start gap-2 cursor-pointer rounded-md border p-2 hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={selected.includes(perm.id)}
              onCheckedChange={(v) => toggle(perm.id, !!v)}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium leading-snug truncate">{perm.description}</p>
              <p className="text-[10px] text-muted-foreground italic truncate">{perm.name}</p>
            </div>
          </label>
        ))}
      </div>
      {isDirty && (
        <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5 mt-1">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Permissions
        </Button>
      )}
    </div>
  );
}

function RoleAppointmentTabsSection({
  role,
  clinicAppointmentTabs,
}: {
  role: RoleWithPerms;
  clinicAppointmentTabs: ClinicAppointmentTabsData;
}) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<number[]>(
    role.ClinicRoleAppointmentTabs.map((t) => t.ClinicAppointmentTab.id),
  );

  const isDirty =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify(
      role.ClinicRoleAppointmentTabs.map((t) => t.ClinicAppointmentTab.id).sort(),
    );

  const toggle = (id: number, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );

  const handleSave = () => {
    startTransition(async () => {
      const result = await setClinicRoleAppointmentTabsAction(role.id, selected);
      if (result.status) {
        toast.success("Appointment tabs saved.");
      } else {
        toast.error(result.message ?? "Failed to save tabs.");
      }
    });
  };

  if (clinicAppointmentTabs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No appointment tabs are enabled for this clinic yet. Configure them in the <em>Appt Tabs</em> tab first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Select which appointment tabs members with this role can see.
      </p>
      <div className="flex flex-wrap gap-2">
        {clinicAppointmentTabs.map((cat) => (
          <label
            key={cat.id}
            className="flex items-center gap-2 cursor-pointer rounded-md border px-3 py-1.5 hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={selected.includes(cat.id)}
              onCheckedChange={(v) => toggle(cat.id, !!v)}
            />
            <span className="text-sm capitalize">{cat.AppointmentTab.name}</span>
          </label>
        ))}
      </div>
      {isDirty && (
        <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5 mt-1">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Tabs
        </Button>
      )}
    </div>
  );
}

function RolesTab({
  clinicUid,
  initialRoles,
  allPermissions,
  clinicAppointmentTabs,
  canUpdateSettings,
}: {
  clinicUid: string;
  initialRoles: RolesWithPermissionsData;
  allPermissions: PermissionsData;
  clinicAppointmentTabs: ClinicAppointmentTabsData;
  canUpdateSettings: boolean;
}) {
  const [roles, setRoles] = useState(initialRoles);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createClinicRoleAction({ name: newName.trim() });
      if (result.status && result.data) {
        setRoles((prev) => [
          ...prev,
          {
            id: result.data!.id,
            name: result.data!.name,
            canAccessDashboard: result.data!.canAccessDashboard,
            restrictToOwnAppointments: result.data!.restrictToOwnAppointments,
            ClinicMembers: [],
            ClinicRoleInitialPermissions: [],
            ClinicRoleAppointmentTabs: [],
          },
        ]);
        setNewName("");
        setShowCreate(false);
        toast.success("Role created.");
      } else {
        toast.error(result.message ?? "Failed to create role.");
      }
    });
  };

  const handleRename = (id: number) => {
    if (!editName.trim()) return;
    startTransition(async () => {
      const result = await updateClinicRoleAction({ id, name: editName.trim() });
      if (result.status) {
        setRoles((prev) =>
          prev.map((r) => (r.id === id ? { ...r, name: editName.trim() } : r)),
        );
        setEditingId(null);
        toast.success("Role renamed.");
      } else {
        toast.error(result.message ?? "Failed to rename role.");
      }
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteClinicRoleAction(id);
      if (result.status) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
        toast.success("Role deleted.");
      } else {
        toast.error(result.message ?? "Failed to delete role.");
      }
      setDeletingId(null);
    });
  };

  const handleToggleDashboardAccess = (roleId: number, canAccessDashboard: boolean) => {
    startTransition(async () => {
      const result = await setClinicRoleDashboardAccessAction(roleId, canAccessDashboard);
      if (result.status) {
        toast.success(result.message);
        setRoles((prev) =>
          prev.map((r) => (r.id === roleId ? { ...r, canAccessDashboard } : r))
        );
      } else {
        toast.error(result.message ?? "Failed to update dashboard access.");
      }
    });
  };

  const handleToggleRestrictToOwnAppointments = (roleId: number, restrictToOwnAppointments: boolean) => {
    startTransition(async () => {
      const result = await setClinicRoleRestrictToOwnAppointmentsAction(roleId, restrictToOwnAppointments);
      if (result.status) {
        toast.success(result.message);
        setRoles((prev) =>
          prev.map((r) => (r.id === roleId ? { ...r, restrictToOwnAppointments } : r))
        );
      } else {
        toast.error(result.message ?? "Failed to update appointment restriction.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Clinic Role</DialogTitle>
            <DialogDescription>Add a new role that can be assigned to clinic members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Role Name</Label>
            <Input
              placeholder="e.g. Receptionist"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending || !newName.trim()} className="gap-1.5">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </div>

      {roles.length === 0 && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
            <Settings2 className="h-8 w-8 opacity-40" />
            <p className="text-sm">No roles found. Create one above.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {roles.map((role) => {
          const owner = isOwner(role.name);
          return (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {owner && <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                    {editingId === role.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-7 text-sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(role.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                        <Button size="sm" variant="default" onClick={() => handleRename(role.id)} disabled={isPending} className="h-7 px-2">
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2">
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <CardTitle className="text-base capitalize">{role.name}</CardTitle>
                    )}
                    <Badge variant="secondary" className="text-xs h-5 px-1.5 flex-shrink-0">
                      {role.ClinicMembers.length} member{role.ClinicMembers.length !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline" className="text-xs h-5 px-1.5 flex-shrink-0 gap-1">
                      <KeyRound className="h-3 w-3" />
                      {role.ClinicRoleInitialPermissions.length} perms
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id={`clinic-dashboard-access-${role.id}`}
                        checked={role.canAccessDashboard}
                        disabled={isPending}
                        onCheckedChange={(checked) =>
                          handleToggleDashboardAccess(role.id, checked)
                        }
                        className="scale-75 origin-right"
                      />
                      <label
                        htmlFor={`clinic-dashboard-access-${role.id}`}
                        className="text-xs text-muted-foreground cursor-pointer select-none whitespace-nowrap"
                      >
                        Dashboard access
                      </label>
                    </div>
                    {canUpdateSettings && (
                      <div className="flex items-center gap-1.5">
                        <Switch
                          id={`restrict-own-appointments-${role.id}`}
                          checked={role.restrictToOwnAppointments}
                          disabled={isPending}
                          onCheckedChange={(checked) =>
                            handleToggleRestrictToOwnAppointments(role.id, checked)
                          }
                          className="scale-75 origin-right"
                        />
                        <label
                          htmlFor={`restrict-own-appointments-${role.id}`}
                          className="text-xs text-muted-foreground cursor-pointer select-none whitespace-nowrap"
                        >
                          Own appointments only
                        </label>
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help flex-shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-64 text-xs">
                              When enabled, members with this role will only see appointments
                              they are assigned to or have involvement in (tagged or routed).
                              Useful for restricting doctors to only view their own patients&apos; appointments.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  {!owner && editingId !== role.id && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          setEditingId(role.id);
                          setEditName(role.name);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        disabled={deletingId === role.id}
                        onClick={() => handleDelete(role.id)}
                      >
                        {deletingId === role.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="perms" className="border-none">
                    <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Initial Permissions
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <RolePermissionsSection
                        role={role}
                        clinicUid={clinicUid}
                        allPermissions={allPermissions}
                      />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="tabs" className="border-none">
                    <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                      <span className="flex items-center gap-1.5">
                        <ListChecks className="h-4 w-4 text-primary" />
                        Visible Appointment Tabs
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <RoleAppointmentTabsSection
                        role={role}
                        clinicAppointmentTabs={clinicAppointmentTabs}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Appointment Tabs                                              */
/* ─────────────────────────────────────────────────────────────────── */

function AppointmentTabsTab({
  clinicUid,
  allAppointmentTabs,
  initialClinicAppointmentTabs,
}: {
  clinicUid: string;
  allAppointmentTabs: AllAppointmentTabsData;
  initialClinicAppointmentTabs: ClinicAppointmentTabsData;
}) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<number[]>(
    initialClinicAppointmentTabs.map((t) => t.AppointmentTab.id),
  );

  const isDirty =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify(
      initialClinicAppointmentTabs.map((t) => t.AppointmentTab.id).sort(),
    );

  const toggle = (id: number, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );

  const handleSave = () => {
    startTransition(async () => {
      const result = await setClinicAppointmentTabsAction(clinicUid, selected);
      if (result.status) {
        toast.success("Appointment tabs saved.");
      } else {
        toast.error(result.message ?? "Failed to save appointment tabs.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          Clinic Appointment Tabs
        </CardTitle>
        <CardDescription>
          Choose which appointment tabs are available in this clinic. Role-level visibility can be further restricted in the <em>Roles</em> tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allAppointmentTabs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appointment tabs configured in the system.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allAppointmentTabs.map((tab) => (
              <label
                key={tab.id}
                className="flex items-start gap-3 cursor-pointer rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selected.includes(tab.id)}
                  onCheckedChange={(v) => toggle(tab.id, !!v)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">{tab.name}</p>
                  {tab.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{tab.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
        {isDirty && (
          <Button onClick={handleSave} disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Documents                                                     */
/* ─────────────────────────────────────────────────────────────────── */

const formatDocumentTypeName = (name: string) =>
  name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function DocumentsTab({ clinicUid }: { clinicUid: string }) {
  const [isPending, startTransition] = useTransition();

  const { data: prescriptionConfigResult, mutate: mutatePrescription } = useClinicPrescriptionConfig(clinicUid);
  const { data: documentDefaultsResult, mutate: mutateDocumentDefaults } = useClinicDocumentSetting(clinicUid);
  const { data: documentTypesResult } = useDocumentTypes();
  const { data: allTemplatesResult } = useDocumentTemplates({ clinicUid });

  const prescriptionConfig = prescriptionConfigResult?.data ?? null;
  const documentDefaults = documentDefaultsResult?.data;
  const documentTypes = documentTypesResult?.data ?? [];
  const allTemplates = allTemplatesResult?.data ?? [];

  const [prescriptionTemplateIdOverride, setPrescriptionTemplateIdOverride] = useState<string | null>(null);
  const [defaultTemplateIdOverrides, setDefaultTemplateIdOverrides] = useState<Record<number, string>>({});

  const remotePrescriptionTemplateId =
    prescriptionConfig?.prescriptionTemplateId?.toString() ?? "";
  const remoteDefaultTemplateIds = useMemo(() => {
    const map: Record<number, string> = {};
    for (const d of documentDefaults ?? []) {
      map[d.documentTypeId] = d.templateId.toString();
    }
    return map;
  }, [documentDefaults]);

  const prescriptionTemplateId =
    prescriptionTemplateIdOverride ?? remotePrescriptionTemplateId;
  const defaultTemplateIds = useMemo(
    () => ({ ...remoteDefaultTemplateIds, ...defaultTemplateIdOverrides }),
    [remoteDefaultTemplateIds, defaultTemplateIdOverrides]
  );

  const prescriptionType = documentTypes.find((t) => t.name === "prescription");
  const nonPrescriptionTypes = documentTypes.filter((t) => t.name !== "prescription");

  const handleSave = () => {
    startTransition(async () => {
      // Only upsert the prescription setting when the user has actually chosen a template.
      // Calling the action with prescriptionTemplateId=undefined would fail on create (non-nullable
      // field) or silently no-op on update — both produce confusing results.
      const prescriptionResult = prescriptionTemplateId
        ? await upsertClinicPrescriptionConfigAction(prescriptionConfig?.id ?? 0, {
            clinicUid,
            prescriptionTemplateId: Number(prescriptionTemplateId),
          })
        : { status: true as const, message: "", data: null };

      const entries = nonPrescriptionTypes.map((type) => ({
        documentTypeId: type.id,
        templateId: defaultTemplateIds[type.id] ? Number(defaultTemplateIds[type.id]) : null,
      }));

      const documentResult = await upsertClinicDocumentDefaultTemplatesAction(clinicUid, entries);

      if (prescriptionResult.status && documentResult.status) {
        mutatePrescription();
        mutateDocumentDefaults();
        toast.success("Document settings saved successfully.");
      } else {
        // Use the message from whichever action actually failed; do NOT use a success message
        // from a passing action (prescriptionResult.message is non-null even on success, so a
        // plain `??` chain would surface it as the "error" when only documentResult failed).
        const errorMsg =
          (!prescriptionResult.status ? prescriptionResult.message : null) ??
          (!documentResult.status ? documentResult.message : null) ??
          "Failed to save document settings.";
        toast.error(errorMsg);
      }
    });
  };

  type TemplateOption = { id: number; name: string };

  const TemplateSelect = ({
    label,
    description,
    value,
    onChange,
    templates,
  }: {
    label: string;
    description: string;
    value: string;
    onChange: (v: string) => void;
    templates: TemplateOption[] | undefined;
  }) => (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="No default (select a template)" />
        </SelectTrigger>
        <SelectContent>
          {(templates ?? []).length === 0 ? (
            <SelectItem value="__none__" disabled>
              No templates available for this type
            </SelectItem>
          ) : (
            (templates ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Template Library ───────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-1">Template Library</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Create and manage document templates for each type. Templates listed here can be selected as defaults below.
        </p>
        {documentTypes.length > 0 ? (
          <Tabs defaultValue={documentTypes[0]?.name}>
            <TabsList className="w-full justify-start h-auto p-1 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden">
              {documentTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.name} className="gap-1.5 flex-shrink-0">
                  {formatDocumentTypeName(type.name)}
                </TabsTrigger>
              ))}
            </TabsList>
            {documentTypes.map((type) => (
              <TabsContent key={type.id} value={type.name} className="mt-4">
                <DocumentTemplates documentType={type.name} label={formatDocumentTypeName(type.name)} clinicUid={clinicUid} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <p className="text-sm text-muted-foreground">No document types configured.</p>
        )}
      </div>

      <Separator />

      {/* ── Default Templates ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Default Document Templates
          </CardTitle>
          <CardDescription>
            Set the default template used when generating each document type for this clinic. Staff can still override the template per record.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prescription — handled by ClinicPrescriptionSetting */}
            {prescriptionType && (
              <TemplateSelect
                key={prescriptionType.id}
                label={formatDocumentTypeName(prescriptionType.name)}
                description={prescriptionType.description ?? `Default template for ${formatDocumentTypeName(prescriptionType.name).toLowerCase()}.`}
                value={prescriptionTemplateId}
                onChange={setPrescriptionTemplateIdOverride}
                templates={allTemplates
                  .filter((t) => t.DocumentTemplateType.id === prescriptionType.id)
                  .map((t) => ({ id: t.id, name: t.name }))}
              />
            )}
            {/* All other document types — driven by ClinicDocumentDefaultTemplate */}
            {nonPrescriptionTypes.map((type) => {
              const templates = allTemplates
                .filter((t) => t.DocumentTemplateType.id === type.id)
                .map((t) => ({ id: t.id, name: t.name }));
              return (
                <TemplateSelect
                  key={type.id}
                  label={formatDocumentTypeName(type.name)}
                  description={type.description ?? `Default template for ${formatDocumentTypeName(type.name).toLowerCase()}.`}
                  value={defaultTemplateIds[type.id] ?? ""}
                  onChange={(v) =>
                    setDefaultTemplateIdOverrides((prev) => ({ ...prev, [type.id]: v }))
                  }
                  templates={templates}
                />
              );
            })}
          </div>
          <Button onClick={handleSave} disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
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
  roles,
  rolesWithPermissions,
  allClinicPermissions,
  appointmentModes,
  appointmentTypes,
  serviceCategories,
  clinicAppointmentTabs,
  allAppointmentTabs,
  googleCalendarConnected = false,
  googleCalendarEmail = null,
  googleCalendarEvents = [],
  initialSystems,
  canUpdateSettings = false,
  konsultaLibrarySummary,
}: ClinicSettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "general";

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Clinic Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure every aspect of <span className="font-medium text-foreground">{clinic.name}</span>.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Horizontally scrollable, no wrapping */}
        <TabsList className="w-full justify-start h-auto p-1 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="general" className="gap-1.5 flex-shrink-0">
            <Building2 className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1.5 flex-shrink-0">
            <Calendar className="h-3.5 w-3.5" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="appt-modes" className="gap-1.5 flex-shrink-0">
            <Globe className="h-3.5 w-3.5" />
            Modes
          </TabsTrigger>
          <TabsTrigger value="appt-types" className="gap-1.5 flex-shrink-0">
            <Layers className="h-3.5 w-3.5" />
            Types
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 flex-shrink-0">
            <Package className="h-3.5 w-3.5" />
            Services
          </TabsTrigger>
          <TabsTrigger value="systems" className="gap-1.5 flex-shrink-0">
            <Zap className="h-3.5 w-3.5" />
            Systems
          </TabsTrigger>
          <TabsTrigger value="appt-tabs" className="gap-1.5 flex-shrink-0">
            <ListChecks className="h-3.5 w-3.5" />
            Appt Tabs
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5 flex-shrink-0">
            <Settings2 className="h-3.5 w-3.5" />
            Roles
            {rolesWithPermissions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                {rolesWithPermissions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="philhealth" className="gap-1.5 flex-shrink-0">
            <Heart className="h-3.5 w-3.5" />
            PhilHealth
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5 flex-shrink-0">
            <Users className="h-3.5 w-3.5" />
            Members
            {members.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                {members.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5 flex-shrink-0">
            <Link2 className="h-3.5 w-3.5" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5 flex-shrink-0">
            <FileText className="h-3.5 w-3.5" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralTab clinicUid={clinicUid} clinic={clinic} clinicSetting={clinicSetting} />
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <AppointmentsTab clinicUid={clinicUid} appointmentConfig={appointmentConfig} clinic={clinic} />
        </TabsContent>

        <TabsContent value="appt-modes" className="mt-6">
          <AppointmentModesTab clinicUid={clinicUid} initialModes={appointmentModes} />
        </TabsContent>

        <TabsContent value="appt-types" className="mt-6">
          <AppointmentTypesTab clinicUid={clinicUid} initialTypes={appointmentTypes} />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <ServicesTab clinicUid={clinicUid} initialCategories={serviceCategories} />
        </TabsContent>

        <TabsContent value="systems" className="mt-6">
          <SystemsTab clinicUid={clinicUid} initialSystems={initialSystems} />
        </TabsContent>

        <TabsContent value="appt-tabs" className="mt-6">
          <AppointmentTabsTab
            clinicUid={clinicUid}
            allAppointmentTabs={allAppointmentTabs}
            initialClinicAppointmentTabs={clinicAppointmentTabs}
          />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <RolesTab
            clinicUid={clinicUid}
            initialRoles={rolesWithPermissions}
            allPermissions={allClinicPermissions}
            clinicAppointmentTabs={clinicAppointmentTabs}
            canUpdateSettings={canUpdateSettings}
          />
        </TabsContent>

        <TabsContent value="philhealth" className="mt-6">
          <PhilHealthTab
            clinicUid={clinicUid}
            clinicSetting={clinicSetting}
            initialKonsultaLibrarySummary={konsultaLibrarySummary}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersTab
            clinicUid={clinicUid}
            initialMembers={members}
            roles={roles}
            allPermissions={allClinicPermissions}
          />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="max-w-5xl">
            <div className="mb-6">
              <h2 className="text-base font-semibold">Integrations</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Connect third-party apps to enhance your clinic workflows.
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
                <GoogleCalendarIntegration connected={googleCalendarConnected} email={googleCalendarEmail} />
                <div className="w-full">
                  {googleCalendarConnected && <CalendarEventsList events={googleCalendarEvents} />}
                </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab clinicUid={clinicUid} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
