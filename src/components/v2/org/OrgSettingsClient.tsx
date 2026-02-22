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
  ChevronDown,
  Shield,
  Plus,
  Settings2,
  Layers,
  KeyRound,
  Bell,
  Lock,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { updateOrganizationAction } from "@/actions/organizations/organization.action";
import {
  setMembershipRequestStatusAction,
  deleteMembershipAction,
} from "@/actions/organizations/org-member.action";
import {
  createOrganizationRoleAction,
  deleteOrganizationRoleAction,
} from "@/actions/organizations/organization-role.action";

import type { GetOrganization } from "@/actions/organizations/organization.action";
import type { GetOrgSetting } from "@/actions/organizations/org-setting.action";
import type { GetOrgMembers } from "@/actions/organizations/org-member.action";
import type { GetOrganizationRoles } from "@/actions/organizations/organization-role.action";
import type { GetPermissions } from "@/actions/permission.action";
import type { GetOrgColleges } from "@/actions/organizations/org-college.action";
import type { GetOrgDepartments } from "@/actions/organizations/org-department.action";
import type { GetOrgPrograms } from "@/actions/organizations/org-program.action";
import type { GetOrgOffices } from "@/actions/organizations/org-office.action";
import type { GetOrganizationYearLevels } from "@/actions/organizations/org-year-level.action";

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

type OrgData = NonNullable<GetOrganization>;
type OrgSettingData = NonNullable<GetOrgSetting["data"]>;
type MembersData = NonNullable<GetOrgMembers["data"]>;
type MemberItem = MembersData["data"][number];
type RolesData = NonNullable<GetOrganizationRoles["data"]>;
type RoleItem = RolesData[number];

interface OrgSettingsClientProps {
  orgUid: string;
  org: OrgData;
  orgSetting: OrgSettingData | null;
  members: MembersData | null;
  roles: RolesData;
  allOrgPermissions: GetPermissions;
  colleges: GetOrgColleges;
  departments: GetOrgDepartments;
  programs: GetOrgPrograms;
  offices: GetOrgOffices;
  yearLevels: GetOrganizationYearLevels;
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
  isPublic: z.boolean(),
  sendEmailNotification: z.boolean(),
  emailToOrgOnly: z.boolean(),
});
type GeneralFormValues = z.infer<typeof generalSchema>;

const addRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().min(1, "Description is required"),
});
type AddRoleFormValues = z.infer<typeof addRoleSchema>;

/* ─────────────────────────────────────────────────────────────────── */
/*  Helper components                                                  */
/* ─────────────────────────────────────────────────────────────────── */

interface SettingRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}
function SettingRow({ label, description, checked, onCheckedChange, disabled }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="flex-shrink-0 ml-4"
      />
    </div>
  );
}

type MemberStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | "INACTIVE";

function StatusBadge({ status }: { status: MemberStatus }) {
  const variants: Record<MemberStatus, string> = {
    ACTIVE: "bg-green-100 text-green-800 border-green-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    SUSPENDED: "bg-red-100 text-red-800 border-red-200",
    INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[status]}`}
    >
      {status}
    </span>
  );
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.charAt(0) ?? "";
  const l = lastName?.charAt(0) ?? "";
  return (f + l).toUpperCase() || "?";
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export function OrgSettingsClient({
  orgUid,
  org,
  orgSetting,
  members,
  roles: initialRoles,
  colleges,
  departments,
  programs,
  offices,
  yearLevels,
}: OrgSettingsClientProps) {
  const [isPending, startTransition] = useTransition();

  /* ── General tab ──────────────────────────────────────────────── */
  const generalForm = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: org.name ?? "",
      description: org.description ?? "",
      email: org.email ?? "",
      logo: org.logo ?? "",
      customUrl: org.customUrl ?? "",
      isPublic: orgSetting?.isPublic ?? false,
      sendEmailNotification: orgSetting?.sendEmailNotification ?? true,
      emailToOrgOnly: orgSetting?.emailToOrgOnly ?? false,
    },
  });

  function onGeneralSubmit(values: GeneralFormValues) {
    startTransition(async () => {
      const result = await updateOrganizationAction(orgUid, {
        name: values.name,
        description: values.description,
        logo: values.logo ?? "",
        customUrl: values.customUrl,
        email: values.email,
        isPublic: values.isPublic,
        sendEmailNotification: values.sendEmailNotification,
        emailToOrgOnly: values.emailToOrgOnly,
      });

      if (result.status) {
        toast.success("Organization settings saved");
      } else {
        toast.error(result.message ?? "Failed to save settings");
      }
    });
  }

  /* ── Members tab ──────────────────────────────────────────────── */
  const memberList: MemberItem[] = members?.data ?? [];

  const [confirmRemoveMemberId, setConfirmRemoveMemberId] = useState<number | null>(null);

  function handleMemberStatus(id: number, status: MemberStatus) {
    startTransition(async () => {
      const result = await setMembershipRequestStatusAction(id, status);
      if (result.status) {
        toast.success(`Member ${status.toLowerCase()}`);
      } else {
        toast.error(result.message ?? "Failed to update member status");
      }
    });
  }

  function handleRemoveMember(id: number) {
    startTransition(async () => {
      const result = await deleteMembershipAction(id);
      if (result.status) {
        toast.success("Member removed");
        setConfirmRemoveMemberId(null);
      } else {
        toast.error(result.message ?? "Failed to remove member");
      }
    });
  }

  /* ── Roles tab ────────────────────────────────────────────────── */
  const [roles, setRoles] = useState<RolesData>(initialRoles);
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [confirmDeleteRoleId, setConfirmDeleteRoleId] = useState<number | null>(null);

  const addRoleForm = useForm<AddRoleFormValues>({
    resolver: zodResolver(addRoleSchema),
    defaultValues: { name: "", description: "" },
  });

  function onAddRole(values: AddRoleFormValues) {
    startTransition(async () => {
      const result = await createOrganizationRoleAction({
        orgUid,
        name: values.name,
        description: values.description,
      });

      if (result.status && result.data) {
        const newRole: RoleItem = {
          ...result.data,
          UserDefaultOrganizationRoles: [],
        };
        setRoles((prev) => [...prev, newRole]);
        toast.success("Role created");
        addRoleForm.reset();
        setAddRoleOpen(false);
      } else {
        toast.error(result.message ?? "Failed to create role");
      }
    });
  }

  function handleDeleteRole(roleId: number) {
    startTransition(async () => {
      const result = await deleteOrganizationRoleAction(roleId);
      if (result.status) {
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
        toast.success("Role deleted");
        setConfirmDeleteRoleId(null);
      } else {
        toast.error(result.message ?? "Failed to delete role");
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  Render                                                          */
  /* ─────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your organization&apos;s profile, members, and structure.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="overflow-x-auto [&::-webkit-scrollbar]:hidden mb-4">
          <TabsTrigger value="general" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-1.5">
            <Layers className="h-4 w-4" />
            Structure
          </TabsTrigger>
          <TabsTrigger value="clinics" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Clinics
          </TabsTrigger>
        </TabsList>

        {/* ── GENERAL TAB ─────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-5">
          <Form {...generalForm}>
            <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-5">
              {/* Basic info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Basic Information</CardTitle>
                  <CardDescription>
                    Update your organization&apos;s core details and public-facing profile.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={generalForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="My Organization" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="org@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalForm.control}
                      name="logo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalForm.control}
                      name="customUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={generalForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your organization..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Privacy & Legal (read-only – contact admin to update these via backend) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Privacy &amp; Legal
                  </CardTitle>
                  <CardDescription>
                    Read-only. Contact a system administrator to update these URLs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Privacy Policy URL</p>
                      <Input
                        disabled
                        readOnly
                        value={org.privacyPolicyUrl ?? ""}
                        placeholder="Not set"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Terms &amp; Conditions URL</p>
                      <Input
                        disabled
                        readOnly
                        value={org.termsAndConditionsUrl ?? ""}
                        placeholder="Not set"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visibility & Notifications */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Visibility &amp; Notifications
                  </CardTitle>
                  <CardDescription>
                    Control who can see your organization and how notifications are sent.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FormField
                    control={generalForm.control}
                    name="isPublic"
                    render={({ field }) => (
                      <SettingRow
                        label="Public Organization"
                        description="Allow anyone to find and view this organization."
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <FormField
                    control={generalForm.control}
                    name="sendEmailNotification"
                    render={({ field }) => (
                      <SettingRow
                        label="Email Notifications"
                        description="Send email notifications for organization activities."
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <FormField
                    control={generalForm.control}
                    name="emailToOrgOnly"
                    render={({ field }) => (
                      <SettingRow
                        label="Organization Emails Only"
                        description="Restrict email notifications to organization members only."
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* ── MEMBERS TAB ─────────────────────────────────────────── */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </CardTitle>
              <CardDescription>
                Manage organization membership and access levels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {memberList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No members found.
                </p>
              ) : (
                memberList.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={member.User.picture ?? undefined} />
                        <AvatarFallback>
                          {getInitials(member.User.firstName, member.User.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {[member.User.firstName, member.User.lastName].filter(Boolean).join(" ") ||
                            member.User.userId}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {member.OrganizationRole && (
                            <span className="text-xs text-muted-foreground">
                              {member.OrganizationRole.name}
                            </span>
                          )}
                          <StatusBadge status={member.status as MemberStatus} />
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1 flex-shrink-0 ml-2">
                          Actions
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleMemberStatus(member.id, "ACTIVE")}
                          disabled={member.status === "ACTIVE" || isPending}
                        >
                          <Globe className="h-4 w-4 mr-2 text-green-600" />
                          Activate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleMemberStatus(member.id, "SUSPENDED")}
                          disabled={member.status === "SUSPENDED" || isPending}
                          className="text-red-600 focus:text-red-600"
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setConfirmRemoveMemberId(member.id)}
                          disabled={isPending}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Confirm remove dialog */}
          <Dialog
            open={confirmRemoveMemberId !== null}
            onOpenChange={(open) => { if (!open) setConfirmRemoveMemberId(null); }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Member</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove this member from the organization? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmRemoveMemberId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => {
                    if (confirmRemoveMemberId !== null) {
                      handleRemoveMember(confirmRemoveMemberId);
                    }
                  }}
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Remove
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── ROLES TAB ───────────────────────────────────────────── */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Organization Roles
                </CardTitle>
                <CardDescription className="mt-1">
                  Define roles that can be assigned to organization members.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-1.5 flex-shrink-0"
                onClick={() => setAddRoleOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Role
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No roles defined yet.
                </p>
              ) : (
                roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{role.name}</p>
                      {role.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {role.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive flex-shrink-0 ml-2"
                      onClick={() => setConfirmDeleteRoleId(role.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Add role dialog */}
          <Dialog open={addRoleOpen} onOpenChange={setAddRoleOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Role</DialogTitle>
                <DialogDescription>
                  Create a new role for your organization members.
                </DialogDescription>
              </DialogHeader>
              <Form {...addRoleForm}>
                <form onSubmit={addRoleForm.handleSubmit(onAddRole)} className="space-y-4">
                  <FormField
                    control={addRoleForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Coordinator" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addRoleForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the role..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setAddRoleOpen(false); addRoleForm.reset(); }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Create Role
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Confirm delete role dialog */}
          <Dialog
            open={confirmDeleteRoleId !== null}
            onOpenChange={(open) => { if (!open) setConfirmDeleteRoleId(null); }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Role</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this role? Members assigned to this role may lose
                  access. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDeleteRoleId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => {
                    if (confirmDeleteRoleId !== null) {
                      handleDeleteRole(confirmDeleteRoleId);
                    }
                  }}
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── STRUCTURE TAB ───────────────────────────────────────── */}
        <TabsContent value="structure">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Academic Structure
              </CardTitle>
              <CardDescription>
                View the academic and administrative structure of your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-1">
                <StructureSection
                  value="colleges"
                  label="Colleges"
                  items={colleges}
                />
                <StructureSection
                  value="departments"
                  label="Departments"
                  items={departments}
                />
                <StructureSection
                  value="programs"
                  label="Programs"
                  items={programs}
                />
                <StructureSection
                  value="offices"
                  label="Offices"
                  items={offices}
                />
                <StructureSection
                  value="year-levels"
                  label="Year Levels"
                  items={yearLevels}
                />
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CLINICS TAB ─────────────────────────────────────────── */}
        <TabsContent value="clinics">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Associated Clinics
              </CardTitle>
              <CardDescription>
                Clinics linked to this organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <Building2 className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium">Clinic associations are managed by administrators</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Contact a system administrator to link or unlink clinics from this organization.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  StructureSection helper                                            */
/* ─────────────────────────────────────────────────────────────────── */

interface StructureItem {
  id: number;
  name: string;
  organizationId: number;
}

interface StructureSectionProps {
  value: string;
  label: string;
  items: StructureItem[];
}

function StructureSection({ value, label, items }: StructureSectionProps) {
  return (
    <AccordionItem value={value} className="border rounded-lg px-4">
      <AccordionTrigger className="text-sm font-medium hover:no-underline">
        <span className="flex items-center gap-2">
          {label}
          <Badge variant="secondary" className="text-xs ml-1">
            {items.length}
          </Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No {label.toLowerCase()} found.</p>
        ) : (
          <ul className="space-y-1 pb-2">
            {items.map((item) => (
              <li key={item.id} className="text-sm py-1 px-2 rounded hover:bg-muted/50">
                {item.name}
              </li>
            ))}
          </ul>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
