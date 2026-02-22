"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Save,
  Loader2,
  Globe,
  Trash2,
  ShieldCheck,
  Plus,
  KeyRound,
  BookOpen,
  GraduationCap,
  Briefcase,
  LayoutList,
  Layers,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { updateOrganizationAction } from "@/actions/organizations/organization.action";
import {
  createOrganizationRoleAction,
  deleteOrganizationRoleAction,
} from "@/actions/organizations/organization-role.action";
import { setOrgRoleInitialPermissionsAction } from "@/actions/org-role-initial-permission.action";
import {
  setMembershipRequestStatusAction,
  deleteMembershipAction,
} from "@/actions/organizations/org-member.action";
import { setOrgMemberPermissionsAction } from "@/actions/organizations/organization-member-permission.action";
import { createOrgOnboardingRequirementAction } from "@/actions/onboarding.action";

import type { GetOrganization } from "@/actions/organizations/organization.action";
import type { GetOrgSetting } from "@/actions/organizations/org-setting.action";
import type { GetOrgMembers } from "@/actions/organizations/org-member.action";
import type { GetOrganizationRoles } from "@/actions/organizations/organization-role.action";
import type { GetPermissions } from "@/actions/permission.action";
import type { GetOrgDepartments } from "@/actions/organizations/org-department.action";
import type { GetOrgColleges } from "@/actions/organizations/org-college.action";
import type { GetOrgPrograms } from "@/actions/organizations/org-program.action";
import type { GetOrgOffices } from "@/actions/organizations/org-office.action";
import type { GetOrganizationYearLevels } from "@/actions/organizations/org-year-level.action";
import type { GetOrgClinics } from "@/actions/organizations/organization-clinics.action";
import type { OrganizationMemberStatus } from "@/types";
type OrgOnboardingRequirement = {
  id: number;
  organizationId: number;
  entityType: "USER" | "PATIENT";
  fieldName: string;
  fieldLabel: string | null;
  isRequired: boolean;
  isActive: boolean;
};

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

type OrgData = NonNullable<GetOrganization>;
type OrgSettingData = NonNullable<GetOrgSetting["data"]>;
type MembersData = NonNullable<NonNullable<GetOrgMembers["data"]>["data"]>;
type RolesData = NonNullable<GetOrganizationRoles["data"]>;
type PermissionsData = NonNullable<GetPermissions>;
type DepartmentsData = GetOrgDepartments;
type CollegesData = GetOrgColleges;
type ProgramsData = GetOrgPrograms;
type OfficesData = GetOrgOffices;
type YearLevelsData = GetOrganizationYearLevels;
type ClinicsData = GetOrgClinics;

interface OrgSettingsClientProps {
  orgUid: string;
  org: OrgData;
  orgSetting: OrgSettingData | null;
  members: MembersData;
  roles: RolesData;
  allOrgPermissions: PermissionsData;
  departments: DepartmentsData;
  colleges: CollegesData;
  programs: ProgramsData;
  offices: OfficesData;
  yearLevels: YearLevelsData;
  clinics: ClinicsData;
  onboardingRequirements: OrgOnboardingRequirement[];
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Zod schemas                                                        */
/* ─────────────────────────────────────────────────────────────────── */

const generalSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  logo: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  customUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  privacyPolicyUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  termsAndConditionsUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  isPublic: z.boolean(),
  sendEmailNotification: z.boolean(),
  emailToOrgOnly: z.boolean(),
});
type GeneralFormValues = z.infer<typeof generalSchema>;

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});
type RoleFormValues = z.infer<typeof roleSchema>;

const onboardingSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  fieldLabel: z.string().optional(),
  entityType: z.enum(["USER", "PATIENT"]),
  isRequired: z.boolean(),
});
type OnboardingFormValues = z.infer<typeof onboardingSchema>;

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
  orgUid,
  org,
  orgSetting,
}: {
  orgUid: string;
  org: OrgData;
  orgSetting: OrgSettingData | null;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: org.name ?? "",
      description: org.description ?? "",
      email: org.email ?? "",
      logo: org.logo ?? "",
      customUrl: org.customUrl ?? "",
      privacyPolicyUrl: org.privacyPolicyUrl ?? "",
      termsAndConditionsUrl: org.termsAndConditionsUrl ?? "",
      isPublic: orgSetting?.isPublic ?? false,
      sendEmailNotification: orgSetting?.sendEmailNotification ?? true,
      emailToOrgOnly: orgSetting?.emailToOrgOnly ?? false,
    },
  });

  const onSubmit = (values: GeneralFormValues) => {
    startTransition(async () => {
      const result = await updateOrganizationAction(orgUid, {
        name: values.name,
        description: values.description,
        email: values.email ?? "",
        logo: values.logo ?? "",
        customUrl: values.customUrl ?? "",
        isPublic: values.isPublic,
        sendEmailNotification: values.sendEmailNotification,
        emailToOrgOnly: values.emailToOrgOnly,
        privacyPolicyUrl: values.privacyPolicyUrl ?? "",
        termsAndConditionsUrl: values.termsAndConditionsUrl ?? "",
      });
      if (result.status) {
        toast.success("Organization settings saved.");
      } else {
        toast.error(result.message ?? "Failed to save settings.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Name, description, and contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="My Organization" />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="org@example.com" type="email" />
                    </FormControl>
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
                      <Input {...field} placeholder="https://..." />
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
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="privacyPolicyUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy Policy URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
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
                    <FormLabel>Terms & Conditions URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
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
                    <Textarea {...field} placeholder="Brief description of your organization" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visibility & Notifications</CardTitle>
            <CardDescription>Control who can see your organization and how notifications are sent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <SettingRow
                  label="Public Organization"
                  description="Allow anyone to find and view your organization."
                >
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </SettingRow>
              )}
            />
            <FormField
              control={form.control}
              name="sendEmailNotification"
              render={({ field }) => (
                <SettingRow
                  label="Email Notifications"
                  description="Send email notifications for membership events."
                >
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </SettingRow>
              )}
            />
            <FormField
              control={form.control}
              name="emailToOrgOnly"
              render={({ field }) => (
                <SettingRow
                  label="Email to Org Only"
                  description="Send email notifications only to org email, not to members."
                >
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </SettingRow>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Roles                                                         */
/* ─────────────────────────────────────────────────────────────────── */

function RolesTab({
  orgUid,
  initialRoles,
  allOrgPermissions,
}: {
  orgUid: string;
  initialRoles: RolesData;
  allOrgPermissions: PermissionsData;
}) {
  const [roles, setRoles] = useState(initialRoles);
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [permDialogRoleId, setPermDialogRoleId] = useState<number | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [permSavePending, startPermSave] = useTransition();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "" },
  });

  const handleCreate = (values: RoleFormValues) => {
    startTransition(async () => {
      const result = await createOrganizationRoleAction({
        orgUid,
        name: values.name,
        description: values.description ?? "",
      });
      if (result.status && result.data) {
        const newRole = result.data;
        setRoles((prev) => [
          ...prev,
          {
            id: newRole.id,
            orgId: newRole.orgId,
            name: newRole.name,
            description: newRole.description ?? null,
            requirements: newRole.requirements,
            UserDefaultOrganizationRoles: [],
          },
        ]);
        toast.success("Role created.");
        form.reset();
        setCreateOpen(false);
      } else {
        toast.error(result.message ?? "Failed to create role.");
      }
    });
  };

  const handleDelete = (roleId: number) => {
    startTransition(async () => {
      const result = await deleteOrganizationRoleAction(roleId);
      if (result.status) {
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
        toast.success("Role deleted.");
      } else {
        toast.error(result.message ?? "Failed to delete role.");
      }
    });
  };

  const openPermDialog = (roleId: number) => {
    setPermDialogRoleId(roleId);
    setSelectedPermIds([]);
  };

  const handleSavePermissions = () => {
    if (permDialogRoleId === null) return;
    startPermSave(async () => {
      const result = await setOrgRoleInitialPermissionsAction({
        orgRoleId: permDialogRoleId,
        orgUid,
        permissionIds: selectedPermIds,
      });
      if (result.status) {
        toast.success("Initial permissions saved.");
        setPermDialogRoleId(null);
      } else {
        toast.error(result.message ?? "Failed to save permissions.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Organization Roles</h3>
          <p className="text-sm text-muted-foreground">Manage roles and their initial permissions.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Role
        </Button>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No roles yet. Create the first one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardContent className="py-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{role.name}</p>
                  {role.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => openPermDialog(role.id)}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Permissions
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => handleDelete(role.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Role Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>Add a new role to your organization.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Student" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Optional description" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="gap-1.5">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Set Permissions Dialog */}
      <Dialog open={permDialogRoleId !== null} onOpenChange={(open) => !open && setPermDialogRoleId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Initial Permissions
            </DialogTitle>
            <DialogDescription>
              Select the permissions that will be granted to members assigned this role.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-72 pr-2">
            <div className="space-y-2">
              {allOrgPermissions.map((perm) => (
                <div key={perm.id} className="flex items-start gap-3 rounded-md border p-2.5">
                  <Checkbox
                    id={`perm-${perm.id}`}
                    checked={selectedPermIds.includes(perm.id)}
                    onCheckedChange={(checked) => {
                      setSelectedPermIds((prev) =>
                        checked ? [...prev, perm.id] : prev.filter((id) => id !== perm.id)
                      );
                    }}
                  />
                  <div className="min-w-0">
                    <Label htmlFor={`perm-${perm.id}`} className="text-xs font-medium cursor-pointer">
                      {perm.name}
                    </Label>
                    {perm.description && (
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermDialogRoleId(null)}>
              Cancel
            </Button>
            <Button disabled={permSavePending} onClick={handleSavePermissions} className="gap-1.5">
              {permSavePending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Members                                                       */
/* ─────────────────────────────────────────────────────────────────── */

type MemberItem = MembersData[number];

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PENDING: "secondary",
  SUSPENDED: "destructive",
  INACTIVE: "outline",
};

function MembersTab({
  orgUid,
  initialMembers,
  allOrgPermissions,
}: {
  orgUid: string;
  initialMembers: MembersData;
  allOrgPermissions: PermissionsData;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [permMember, setPermMember] = useState<MemberItem | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [permSavePending, startPermSave] = useTransition();

  const filtered = statusFilter === "ALL"
    ? members
    : members.filter((m) => m.status === statusFilter);

  const handleStatusChange = (id: number, status: OrganizationMemberStatus) => {
    startTransition(async () => {
      const result = await setMembershipRequestStatusAction(id, status);
      if (result.status) {
        setMembers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status } : m))
        );
        toast.success(`Member status updated to ${status}.`);
      } else {
        toast.error(result.message ?? "Failed to update status.");
      }
    });
  };

  const handleRemove = (id: number) => {
    startTransition(async () => {
      const result = await deleteMembershipAction(id);
      if (result.status) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        toast.success("Member removed.");
      } else {
        toast.error(result.message ?? "Failed to remove member.");
      }
    });
  };

  const openPermDialog = (member: MemberItem) => {
    setPermMember(member);
    setSelectedPermIds([]);
  };

  const handleSaveMemberPerms = () => {
    if (!permMember) return;
    startPermSave(async () => {
      const result = await setOrgMemberPermissionsAction({
        userId: permMember.User.userId,
        orgUid,
        permissionIds: selectedPermIds,
      });
      if (result.status) {
        toast.success("Member permissions saved.");
        setPermMember(null);
      } else {
        toast.error(result.message ?? "Failed to save permissions.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Members</h3>
          <p className="text-sm text-muted-foreground">Manage organization membership.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No members found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((member) => (
            <Card key={member.id}>
              <CardContent className="py-3 flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={member.User.picture ?? undefined} />
                  <AvatarFallback>
                    {(member.User.firstName?.[0] ?? "") + (member.User.lastName?.[0] ?? "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.User.firstName} {member.User.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.OrganizationRole.name}</p>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[member.status] ?? "outline"}>
                  {member.status}
                </Badge>
                <div className="flex gap-1.5 shrink-0">
                  {member.status !== "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleStatusChange(member.id, "ACTIVE")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                  )}
                  {member.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleStatusChange(member.id, "SUSPENDED")}
                    >
                      <XCircle className="h-3.5 w-3.5 text-yellow-600" />
                    </Button>
                  )}
                  {member.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleStatusChange(member.id, "INACTIVE")}
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPermDialog(member)}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => handleRemove(member.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Member Permissions Dialog */}
      <Dialog open={permMember !== null} onOpenChange={(open) => !open && setPermMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Permissions — {permMember?.User.firstName} {permMember?.User.lastName}
            </DialogTitle>
            <DialogDescription>Override permissions for this member.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-72 pr-2">
            <div className="space-y-2">
              {allOrgPermissions.map((perm) => (
                <div key={perm.id} className="flex items-start gap-3 rounded-md border p-2.5">
                  <Checkbox
                    id={`mperm-${perm.id}`}
                    checked={selectedPermIds.includes(perm.id)}
                    onCheckedChange={(checked) => {
                      setSelectedPermIds((prev) =>
                        checked ? [...prev, perm.id] : prev.filter((id) => id !== perm.id)
                      );
                    }}
                  />
                  <div className="min-w-0">
                    <Label htmlFor={`mperm-${perm.id}`} className="text-xs font-medium cursor-pointer">
                      {perm.name}
                    </Label>
                    {perm.description && (
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermMember(null)}>Cancel</Button>
            <Button disabled={permSavePending} onClick={handleSaveMemberPerms} className="gap-1.5">
              {permSavePending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Structure (read-only)                                         */
/* ─────────────────────────────────────────────────────────────────── */

function StructureTab({
  colleges,
  departments,
  programs,
  offices,
}: {
  colleges: CollegesData;
  departments: DepartmentsData;
  programs: ProgramsData;
  offices: OfficesData;
}) {
  const sections = [
    { label: "Colleges", icon: GraduationCap, items: colleges },
    { label: "Departments", icon: Briefcase, items: departments },
    { label: "Programs", icon: BookOpen, items: programs },
    { label: "Offices", icon: LayoutList, items: offices },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Academic & Office Structure</h3>
        <p className="text-sm text-muted-foreground">View colleges, departments, programs, and offices.</p>
      </div>
      <Accordion type="multiple" className="space-y-2">
        {sections.map(({ label, icon: Icon, items }) => (
          <AccordionItem key={label} value={label} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
                <Badge variant="secondary" className="ml-1">{items.length}</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No {label.toLowerCase()} added yet.</p>
              ) : (
                <div className="space-y-1.5 pb-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
                      <span className="text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Year Levels (read-only)                                       */
/* ─────────────────────────────────────────────────────────────────── */

function YearLevelsTab({ yearLevels }: { yearLevels: YearLevelsData }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Year Levels</h3>
        <p className="text-sm text-muted-foreground">View defined year levels for the organization.</p>
      </div>
      {yearLevels.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No year levels added yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {yearLevels.map((yl) => (
            <div key={yl.id} className="flex items-center gap-2 rounded-md border px-3 py-2.5">
              <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{yl.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Onboarding                                                    */
/* ─────────────────────────────────────────────────────────────────── */

function OnboardingTab({
  org,
  initialRequirements,
}: {
  org: OrgData;
  initialRequirements: OrgOnboardingRequirement[];
}) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [isPending, startTransition] = useTransition();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fieldName: "",
      fieldLabel: "",
      entityType: "USER",
      isRequired: true,
    },
  });

  const onSubmit = (values: OnboardingFormValues) => {
    startTransition(async () => {
      const result = await createOrgOnboardingRequirementAction({
        organizationId: org.id,
        entityType: values.entityType,
        fieldName: values.fieldName,
        fieldLabel: values.fieldLabel,
        isRequired: values.isRequired,
      });
      if (result.status && result.data) {
        setRequirements((prev) => {
          const idx = prev.findIndex(
            (r) => r.fieldName === result.data!.fieldName && r.entityType === result.data!.entityType
          );
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = result.data!;
            return updated;
          }
          return [...prev, result.data!];
        });
        toast.success("Onboarding requirement saved.");
        form.reset();
      } else {
        toast.error(result.message ?? "Failed to save requirement.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Onboarding Requirements</h3>
        <p className="text-sm text-muted-foreground">
          Define required fields for members during onboarding.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Requirement</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fieldName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. studentId" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fieldLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Label</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Student ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entity Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USER">User</SelectItem>
                          <SelectItem value="PATIENT">Patient</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-end gap-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel>Required</FormLabel>
                        <FormDescription>Mark as mandatory for members.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending} size="sm" className="gap-1.5">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Requirement
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {requirements.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No onboarding requirements defined yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {requirements.map((req) => (
            <Card key={req.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{req.fieldLabel ?? req.fieldName}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.fieldName} · {req.entityType}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={req.isRequired ? "default" : "secondary"}>
                    {req.isRequired ? "Required" : "Optional"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Clinics (read-only)                                           */
/* ─────────────────────────────────────────────────────────────────── */

function ClinicsTab({ clinics }: { clinics: ClinicsData }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Associated Clinics</h3>
        <p className="text-sm text-muted-foreground">Clinics linked to this organization.</p>
      </div>
      {clinics.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No clinics linked to this organization.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clinics.map((c) => (
            <Card key={c.Clinic.clinicUid}>
              <CardContent className="py-4 flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-md shrink-0">
                  <AvatarImage src={c.Clinic.logo ?? undefined} />
                  <AvatarFallback className="rounded-md text-xs">
                    {c.Clinic.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.Clinic.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.Clinic.clinicUid}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main Component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export function OrgSettingsClient({
  orgUid,
  org,
  orgSetting,
  members,
  roles,
  allOrgPermissions,
  departments,
  colleges,
  programs,
  offices,
  yearLevels,
  clinics,
  onboardingRequirements,
}: OrgSettingsClientProps) {
  return (
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            Organization Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage settings, roles, members, and structure for <span className="font-medium">{org.name}</span>.
          </p>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Members
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Structure
          </TabsTrigger>
          <TabsTrigger value="year-levels" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Year Levels
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="clinics" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Clinics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralTab orgUid={orgUid} org={org} orgSetting={orgSetting} />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <RolesTab orgUid={orgUid} initialRoles={roles} allOrgPermissions={allOrgPermissions} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersTab orgUid={orgUid} initialMembers={members} allOrgPermissions={allOrgPermissions} />
        </TabsContent>

        <TabsContent value="structure" className="mt-6">
          <StructureTab colleges={colleges} departments={departments} programs={programs} offices={offices} />
        </TabsContent>

        <TabsContent value="year-levels" className="mt-6">
          <YearLevelsTab yearLevels={yearLevels} />
        </TabsContent>

        <TabsContent value="onboarding" className="mt-6">
          <OnboardingTab org={org} initialRequirements={onboardingRequirements} />
        </TabsContent>

        <TabsContent value="clinics" className="mt-6">
          <ClinicsTab clinics={clinics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
