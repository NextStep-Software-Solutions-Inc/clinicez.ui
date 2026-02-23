"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  Bell,
  Save,
  Loader2,
  Globe,
  XCircle,
  Trash2,
  Pencil,
  Plus,
  GraduationCap,
  BookOpen,
  Layers,
  Briefcase,
  LayoutGrid,
  KeyRound,
  ShieldCheck,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

import { updateOrganizationAction } from "@/actions/organizations/organization.action";
import {
  createOrganizationRoleAction,
  updateOrganizationRoleAction,
  deleteOrganizationRoleAction,
  setOrganizationRoleRequirementsAction,
  setOrgRoleDashboardAccessAction,
} from "@/actions/organizations/organization-role.action";
import {
  createOrgCollegeAction,
  updateOrgCollegeAction,
  deleteOrgCollegeAction,
} from "@/actions/organizations/org-college.action";
import {
  createOrgDepartmentAction,
  updateOrgDepartmentAction,
  deleteOrgDepartmentAction,
} from "@/actions/organizations/org-department.action";
import {
  createOrgProgramAction,
  updateOrgProgramAction,
  deleteOrgProgramAction,
} from "@/actions/organizations/org-program.action";
import {
  createOrgYearLevelAction,
  updateOrgYearLevelAction,
  deleteOrgYearLevelAction,
} from "@/actions/organizations/org-year-level.action";
import {
  createOrgOfficeAction,
  updateOrgOfficeAction,
  deleteOrgOfficeAction,
} from "@/actions/organizations/org-office.action";
import { setOrgRoleInitialPermissionsAction } from "@/actions/org-role-initial-permission.action";

import type { GetOrganization } from "@/actions/organizations/organization.action";
import type { GetOrganizationRolesWithPermissions } from "@/actions/organizations/organization-role.action";
import type { GetOrgColleges } from "@/actions/organizations/org-college.action";
import type { GetOrgDepartments } from "@/actions/organizations/org-department.action";
import type { GetOrgPrograms } from "@/actions/organizations/org-program.action";
import type { GetOrganizationYearLevels } from "@/actions/organizations/org-year-level.action";
import type { GetOrgOffices } from "@/actions/organizations/org-office.action";
import type { GetPermissions } from "@/actions/permission.action";

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

type OrgData = NonNullable<GetOrganization>;
type RolesWithPermissionsData = NonNullable<GetOrganizationRolesWithPermissions>;
type CollegesData = NonNullable<GetOrgColleges>;
type DepartmentsData = NonNullable<GetOrgDepartments>;
type ProgramsData = NonNullable<GetOrgPrograms>;
type YearLevelsData = NonNullable<GetOrganizationYearLevels>;
type OfficesData = NonNullable<GetOrgOffices>;
type PermissionsData = NonNullable<GetPermissions>;

export interface OrgSettingsClientProps {
  orgUid: string;
  org: OrgData;
  rolesWithPermissions: RolesWithPermissionsData;
  colleges: CollegesData;
  departments: DepartmentsData;
  programs: ProgramsData;
  yearLevels: YearLevelsData;
  offices: OfficesData;
  allPermissions: PermissionsData;
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
  children: ReactNode;
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
}: {
  orgUid: string;
  org: OrgData;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: org.name,
      description: org.description ?? "",
      email: org.email ?? "",
      logo: org.logo ?? "",
      customUrl: org.customUrl ?? "",
      privacyPolicyUrl: org.privacyPolicyUrl ?? "",
      termsAndConditionsUrl: org.termsAndConditionsUrl ?? "",
      isPublic: org.OrganizationSetting?.isPublic ?? false,
      sendEmailNotification: org.OrganizationSetting?.sendEmailNotification ?? true,
      emailToOrgOnly: org.OrganizationSetting?.emailToOrgOnly ?? false,
    },
  });

  function onSubmit(values: GeneralFormValues) {
    startTransition(async () => {
      const result = await updateOrganizationAction(orgUid, {
        name: values.name,
        description: values.description,
        email: values.email,
        logo: values.logo ?? "",
        customUrl: values.customUrl,
        privacyPolicyUrl: values.privacyPolicyUrl,
        termsAndConditionsUrl: values.termsAndConditionsUrl,
        isPublic: values.isPublic,
        sendEmailNotification: values.sendEmailNotification,
        emailToOrgOnly: values.emailToOrgOnly,
      });
      if (result.status) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Update your organization&apos;s public-facing details.
            </CardDescription>
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
                      <Input placeholder="Enter organization name" {...field} />
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
                      <Input placeholder="org@example.com" {...field} />
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
                      <Input placeholder="https://..." {...field} />
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
                      <Input placeholder="https://..." {...field} />
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
                    <Textarea
                      placeholder="Brief description of the organization"
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

        {/* Legal URLs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Legal &amp; Policies
            </CardTitle>
            <CardDescription>
              Links to your organization&apos;s legal documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="privacyPolicyUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy Policy URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
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
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Visibility */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications &amp; Visibility
            </CardTitle>
            <CardDescription>
              Control who can find this organization and how emails are sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <SettingRow
                  label="Public Organization"
                  description="Allow anyone to find and join this organization"
                >
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </SettingRow>
              )}
            />
            <FormField
              control={form.control}
              name="sendEmailNotification"
              render={({ field }) => (
                <SettingRow
                  label="Email Notifications"
                  description="Send email notifications for membership updates"
                >
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </SettingRow>
              )}
            />
            <FormField
              control={form.control}
              name="emailToOrgOnly"
              render={({ field }) => (
                <SettingRow
                  label="Org-only Emails"
                  description="Restrict notification emails to organization addresses only"
                >
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </SettingRow>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="gap-1.5">
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
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Generic CRUD list for simple structure items (name only)          */
/* ─────────────────────────────────────────────────────────────────── */

type SimpleItem = { id: number; name: string };

function SimpleCrudTab({
  icon,
  title,
  description,
  items,
  onCreate,
  onUpdate,
  onDelete,
  namePlaceholder,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  items: SimpleItem[];
  onCreate: (name: string) => Promise<{ status: boolean; message: string; data: SimpleItem | null }>;
  onUpdate: (id: number, name: string) => Promise<{ status: boolean; message: string }>;
  onDelete: (id: number) => Promise<{ status: boolean; message: string }>;
  namePlaceholder?: string;
}) {
  const [localItems, setLocalItems] = useState<SimpleItem[]>(items);
  const [newName, setNewName] = useState("");
  const [editItem, setEditItem] = useState<SimpleItem | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await onCreate(newName.trim());
      if (result.status && result.data) {
        toast.success(result.message);
        const createdItem = result.data;
        setLocalItems((prev) => [
          ...prev,
          { id: createdItem.id, name: createdItem.name },
        ]);
        setNewName("");
      } else if (result.status) {
        toast.success(result.message);
        setNewName("");
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleUpdate() {
    if (!editItem || !editName.trim()) return;
    startTransition(async () => {
      const result = await onUpdate(editItem.id, editName.trim());
      if (result.status) {
        toast.success(result.message);
        setLocalItems((prev) =>
          prev.map((i) => (i.id === editItem.id ? { ...i, name: editName.trim() } : i))
        );
        setEditItem(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await onDelete(id);
      if (result.status) {
        toast.success(result.message);
        setLocalItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        toast.error(result.message);
      }
      setDeleteId(null);
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new */}
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={namePlaceholder ?? `New ${title.toLowerCase()} name`}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1"
            />
            <Button
              onClick={handleCreate}
              disabled={isPending || !newName.trim()}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <Separator />

          {/* List */}
          {localItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No {title.toLowerCase()} added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {localItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditItem(item);
                        setEditName(item.name);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {title.replace(/s$/, "")}</DialogTitle>
            <DialogDescription>Update the name of this item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Name</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter name"
              onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isPending || !editName.trim()}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {title.replace(/s$/, "")}</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this item?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => deleteId !== null && handleDelete(deleteId)}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tab: Roles                                                         */
/* ─────────────────────────────────────────────────────────────────── */

type RoleWithPerms = RolesWithPermissionsData[number];

/* ── Role default permissions sub-section ── */
function RolePermissionsSection({
  role,
  orgUid,
  allPermissions,
}: {
  role: RoleWithPerms;
  orgUid: string;
  allPermissions: PermissionsData;
}) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<number[]>(
    role.OrgRoleInitialPermissions.map((rp) => rp.Permission.id),
  );

  const isDirty =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify(role.OrgRoleInitialPermissions.map((rp) => rp.Permission.id).sort());

  const toggle = (id: number, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  const handleSave = () => {
    startTransition(async () => {
      const result = await setOrgRoleInitialPermissionsAction({
        orgRoleId: role.id,
        orgUid,
        permissionIds: selected,
      });
      if (result.status) {
        toast.success("Default permissions saved.");
      } else {
        toast.error(result.message ?? "Failed to save permissions.");
      }
    });
  };

  if (allPermissions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No permissions available.</p>
    );
  }

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
              <p className="text-xs font-medium leading-snug truncate">
                {perm.description ?? perm.name}
              </p>
              <p className="text-[10px] text-muted-foreground italic truncate">{perm.name}</p>
            </div>
          </label>
        ))}
      </div>
      {isDirty && (
        <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5 mt-1">
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save Permissions
        </Button>
      )}
    </div>
  );
}

function RolesTab({
  orgUid,
  roles,
  allPermissions,
}: {
  orgUid: string;
  roles: RolesWithPermissionsData;
  allPermissions: PermissionsData;
}) {
  const [localRoles, setLocalRoles] = useState(roles);
  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<RoleWithPerms | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [reqRole, setReqRole] = useState<RoleWithPerms | null>(null);
  const [permRole, setPermRole] = useState<RoleWithPerms | null>(null);
  const [newReq, setNewReq] = useState("");
  const [localReqs, setLocalReqs] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const createForm = useForm<{ name: string; description: string }>({
    defaultValues: { name: "", description: "" },
  });
  const editForm = useForm<{ name: string; description: string }>({
    defaultValues: { name: "", description: "" },
  });

  function handleCreate(values: { name: string; description: string }) {
    startTransition(async () => {
      const result = await createOrganizationRoleAction({
        orgUid,
        name: values.name,
        description: values.description,
      });
      if (result.status) {
        toast.success(result.message);
        if (result.data) {
          const createdRole = result.data;
          setLocalRoles((prev) => [
            ...prev,
            {
              id: createdRole.id,
              orgId: createdRole.orgId,
              name: createdRole.name,
              description: createdRole.description,
              requirements: createdRole.requirements,
              canAccessDashboard: createdRole.canAccessDashboard,
              OrgRoleInitialPermissions: [],
            },
          ]);
        }
        setShowCreate(false);
        createForm.reset();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleEdit(values: { name: string; description: string }) {
    if (!editRole) return;
    startTransition(async () => {
      const result = await updateOrganizationRoleAction(editRole.id, {
        name: values.name,
        description: values.description ?? undefined,
      });
      if (result.status) {
        toast.success(result.message);
        setLocalRoles((prev) =>
          prev.map((r) =>
            r.id === editRole.id
              ? { ...r, name: values.name, description: values.description }
              : r
          )
        );
        setEditRole(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteOrganizationRoleAction(id);
      if (result.status) {
        toast.success(result.message);
        setLocalRoles((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error(result.message);
      }
      setDeleteId(null);
    });
  }

  function openReqDialog(role: RolesWithPermissionsData[number]) {
    setReqRole(role);
    setLocalReqs([...role.requirements]);
    setNewReq("");
  }

  function handleSaveRequirements() {
    if (!reqRole) return;
    startTransition(async () => {
      const result = await setOrganizationRoleRequirementsAction(reqRole.id, localReqs);
      if (result.status) {
        toast.success(result.message);
        setLocalRoles((prev) =>
          prev.map((r) => (r.id === reqRole.id ? { ...r, requirements: localReqs } : r))
        );
        setReqRole(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleToggleDashboardAccess(roleId: number, canAccessDashboard: boolean) {
    startTransition(async () => {
      const result = await setOrgRoleDashboardAccessAction(roleId, canAccessDashboard);
      if (result.status) {
        toast.success(result.message);
        setLocalRoles((prev) =>
          prev.map((r) => (r.id === roleId ? { ...r, canAccessDashboard } : r))
        );
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Organization Roles
              </CardTitle>
              <CardDescription className="mt-1">
                Manage roles that members can be assigned to.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Add Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {localRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No roles defined yet.
            </p>
          ) : (
            <div className="space-y-2">
              {localRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    )}
                    {role.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {role.requirements.map((req) => (
                          <Badge key={req} variant="secondary" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        id={`dashboard-access-${role.id}`}
                        checked={role.canAccessDashboard}
                        disabled={isPending}
                        onCheckedChange={(checked) =>
                          handleToggleDashboardAccess(role.id, checked)
                        }
                        className="scale-75 origin-left"
                      />
                      <label
                        htmlFor={`dashboard-access-${role.id}`}
                        className="text-xs text-muted-foreground cursor-pointer select-none"
                      >
                        Dashboard access
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => setPermRole(role)}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Perms
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => openReqDialog(role)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Reqs
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditRole(role);
                        editForm.reset({
                          name: role.name,
                          description: role.description ?? "",
                        });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(role.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>Add a new role to the organization.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(handleCreate)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                {...createForm.register("name", { required: true })}
                placeholder="Role name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                {...createForm.register("description")}
                placeholder="Optional description"
                className="resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editRole} onOpenChange={(open) => !open && setEditRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role name and description.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(handleEdit)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...editForm.register("name", { required: true })} placeholder="Role name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                {...editForm.register("description")}
                placeholder="Optional description"
                className="resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditRole(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              This will deactivate the role. Members with this role will not be affected immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => deleteId !== null && handleDelete(deleteId)}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Requirements Dialog */}
      <Dialog open={!!reqRole} onOpenChange={(open) => !open && setReqRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Role Requirements</DialogTitle>
            <DialogDescription>
              Documents or criteria required for members with this role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              <Input
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
                placeholder="e.g. Valid ID, Certificate"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newReq.trim()) {
                    setLocalReqs((prev) => [...prev, newReq.trim()]);
                    setNewReq("");
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                disabled={!newReq.trim()}
                onClick={() => {
                  if (newReq.trim()) {
                    setLocalReqs((prev) => [...prev, newReq.trim()]);
                    setNewReq("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {localReqs.length > 0 ? (
              <div className="space-y-1">
                {localReqs.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md border text-sm"
                  >
                    <span>{req}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() =>
                        setLocalReqs((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                No requirements added.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRequirements} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Default Permissions Dialog */}
      <Dialog open={!!permRole} onOpenChange={(open) => !open && setPermRole(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Default Permissions — {permRole?.name}</DialogTitle>
            <DialogDescription>
              Permissions automatically granted when a member is assigned this role.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {permRole && (
              <RolePermissionsSection
                role={permRole}
                orgUid={orgUid}
                allPermissions={allPermissions}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermRole(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export function OrgSettingsClient({
  orgUid,
  org,
  rolesWithPermissions,
  colleges,
  departments,
  programs,
  yearLevels,
  offices,
  allPermissions,
}: OrgSettingsClientProps) {
  return (
    <div className="space-y-6 px-4 md:px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your organization&apos;s configuration, structure, and preferences.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-5">
        <TabsList className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden w-full justify-start h-auto flex-nowrap gap-1 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="general" className="gap-1.5 flex-shrink-0">
            <Building2 className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5 flex-shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="colleges" className="gap-1.5 flex-shrink-0">
            <GraduationCap className="h-3.5 w-3.5" />
            Colleges
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-1.5 flex-shrink-0">
            <Layers className="h-3.5 w-3.5" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="programs" className="gap-1.5 flex-shrink-0">
            <BookOpen className="h-3.5 w-3.5" />
            Programs
          </TabsTrigger>
          <TabsTrigger value="yearLevels" className="gap-1.5 flex-shrink-0">
            <LayoutGrid className="h-3.5 w-3.5" />
            Year Levels
          </TabsTrigger>
          <TabsTrigger value="offices" className="gap-1.5 flex-shrink-0">
            <Briefcase className="h-3.5 w-3.5" />
            Offices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab orgUid={orgUid} org={org} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab orgUid={orgUid} roles={rolesWithPermissions} allPermissions={allPermissions} />
        </TabsContent>

        <TabsContent value="colleges">
          <SimpleCrudTab
            icon={<GraduationCap className="h-4 w-4" />}
            title="Colleges"
            description="Manage colleges associated with this organization."
            items={colleges.map((c) => ({ id: c.id, name: c.name }))}
            onCreate={(name) => createOrgCollegeAction(orgUid, { name })}
            onUpdate={(id, name) => updateOrgCollegeAction(id, { name })}
            onDelete={deleteOrgCollegeAction}
            namePlaceholder="College name"
          />
        </TabsContent>

        <TabsContent value="departments">
          <SimpleCrudTab
            icon={<Layers className="h-4 w-4" />}
            title="Departments"
            description="Manage departments within this organization."
            items={departments.map((d) => ({ id: d.id, name: d.name }))}
            onCreate={(name) => createOrgDepartmentAction(orgUid, { name })}
            onUpdate={(id, name) => updateOrgDepartmentAction(id, { name })}
            onDelete={deleteOrgDepartmentAction}
            namePlaceholder="Department name"
          />
        </TabsContent>

        <TabsContent value="programs">
          <SimpleCrudTab
            icon={<BookOpen className="h-4 w-4" />}
            title="Programs"
            description="Manage academic programs offered by this organization."
            items={programs.map((p) => ({ id: p.id, name: p.name }))}
            onCreate={(name) => createOrgProgramAction(orgUid, { name })}
            onUpdate={(id, name) => updateOrgProgramAction(id, { name })}
            onDelete={deleteOrgProgramAction}
            namePlaceholder="Program name"
          />
        </TabsContent>

        <TabsContent value="yearLevels">
          <SimpleCrudTab
            icon={<LayoutGrid className="h-4 w-4" />}
            title="Year Levels"
            description="Define year levels used across the organization."
            items={yearLevels.map((y) => ({ id: y.id, name: y.name }))}
            onCreate={(name) => createOrgYearLevelAction(orgUid, { name })}
            onUpdate={(id, name) => updateOrgYearLevelAction(id, { name })}
            onDelete={deleteOrgYearLevelAction}
            namePlaceholder="e.g. 1st Year, 2nd Year"
          />
        </TabsContent>

        <TabsContent value="offices">
          <SimpleCrudTab
            icon={<Briefcase className="h-4 w-4" />}
            title="Offices"
            description="Manage offices and administrative units."
            items={offices.map((o) => ({ id: o.id, name: o.name }))}
            onCreate={(name) => createOrgOfficeAction(orgUid, { name })}
            onUpdate={(id, name) => updateOrgOfficeAction(id, { name })}
            onDelete={deleteOrgOfficeAction}
            namePlaceholder="Office name"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
