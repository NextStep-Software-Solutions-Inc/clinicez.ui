"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Search,
  Crown,
  Trash2,
  ChevronDown,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  KeyRound,
  Save,
  Pencil,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  setMembershipRequestStatusAction,
  deleteMembershipAction,
  addOrgMemberAction,
  searchNonOrgMembersAction,
  updateOrgMemberRoleAction,
} from "@/actions/organizations/org-member.action";
import { setOrgMemberPermissionsAction } from "@/actions/organizations/organization-member-permission.action";

import type { GetOrgMembers } from "@/actions/organizations/org-member.action";
import type { GetOrganizationRoles } from "@/actions/organizations/organization-role.action";
import type { GetPermissions } from "@/actions/permission.action";
import type { SearchNonOrgMembers } from "@/actions/organizations/org-member.action";

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

type MembersData = NonNullable<NonNullable<GetOrgMembers["data"]>["data"]>;
type MemberItem = MembersData[number];
type RolesData = NonNullable<NonNullable<GetOrganizationRoles>["data"]>;
type PermissionsData = NonNullable<GetPermissions>;
type UserSearchResult = NonNullable<NonNullable<SearchNonOrgMembers["data"]>>[number];

type StatusFilter = "ALL" | "ACTIVE" | "PENDING" | "SUSPENDED" | "INACTIVE";

/* ─────────────────────────────────────────────────────────────────── */
/*  Props                                                              */
/* ─────────────────────────────────────────────────────────────────── */

interface OrgMembersClientProps {
  orgUid: string;
  orgName: string;
  initialMembers: MembersData;
  totalCount: number;
  roles: RolesData;
  allPermissions: PermissionsData;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Helpers                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function getInitials(firstName?: string | null, lastName?: string | null) {
  return [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
}

function isOwnerRole(roleName: string) {
  return roleName.toLowerCase() === "owner";
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "PENDING") return "secondary";
  if (status === "SUSPENDED") return "destructive";
  return "outline";
}

function getFullName(user: MemberItem["User"]) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ");
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Sub-component: Add Member Dialog                                   */
/* ─────────────────────────────────────────────────────────────────── */

interface AddMemberDialogProps {
  orgUid: string;
  roles: RolesData;
  onAdded: (member: MemberItem) => void;
}

function AddMemberDialog({ orgUid, roles, onAdded }: AddMemberDialogProps) {
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
          const res = await searchNonOrgMembersAction(orgUid, q);
          setResults(res.data ?? []);
          setShowDropdown(true);
        } finally {
          setIsSearching(false);
        }
      }, 350);
    },
    [orgUid],
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
      const result = await addOrgMemberAction({
        orgUid,
        userId: selectedUser.userId,
        roleId: Number(selectedRoleId),
      });
      if (result.status && result.data) {
        toast.success("Member added successfully.");
        onAdded(result.data);
        reset();
        setOpen(false);
      } else {
        toast.error(result.message ?? "Failed to add member.");
      }
    });
  };

  const nonOwnerRoles = roles.filter((r) => !isOwnerRole(r.name));

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <UserPlus className="h-4 w-4" />
        Add Member
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Organization Member</DialogTitle>
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
                  value={
                    selectedUser
                      ? [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ") || selectedUser.email
                      : query
                  }
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

            {/* Role select */}
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
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedUser || !selectedRoleId || isPending}
              className="gap-1.5"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Sub-component: Change Role Dialog                                  */
/* ─────────────────────────────────────────────────────────────────── */

interface ChangeRoleDialogProps {
  member: MemberItem;
  roles: RolesData;
  onChanged: (memberId: number, newRoleId: number, newRoleName: string) => void;
}

function ChangeRoleMenuItem({ member, roles, onChanged }: ChangeRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    String(member.OrganizationRole.id),
  );
  const [isPending, startTransition] = useTransition();

  const nonOwnerRoles = roles.filter((r) => !isOwnerRole(r.name));

  const handleSave = () => {
    startTransition(async () => {
      const role = roles.find((r) => r.id === Number(selectedRoleId));
      if (!role) return;
      const result = await updateOrgMemberRoleAction(member.id, Number(selectedRoleId));
      if (result.status) {
        toast.success("Role updated successfully.");
        onChanged(member.id, Number(selectedRoleId), role.name);
        setOpen(false);
      } else {
        toast.error(result.message ?? "Failed to update role.");
      }
    });
  };

  return (
    <>
      <DropdownMenuItem
        className="gap-2"
        onSelect={(e) => { e.preventDefault(); setOpen(true); }}
      >
        <Pencil className="h-4 w-4" />
        Change Role
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {getFullName(member.User) || member.User.userId}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>Role</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nonOwnerRoles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || String(member.OrganizationRole.id) === selectedRoleId}
              className="gap-1.5"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Sub-component: Member Permissions Dialog                           */
/* ─────────────────────────────────────────────────────────────────── */

interface MemberPermissionsDialogProps {
  orgUid: string;
  member: MemberItem;
  allPermissions: PermissionsData;
  onSaved: (memberId: number, permissionIds: number[]) => void;
}

function MemberPermissionsMenuItem({
  orgUid,
  member,
  allPermissions,
  onSaved,
}: MemberPermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>(
    member.OrgMemberPermissions.map((p) => p.permissionId),
  );
  const [isPending, startTransition] = useTransition();

  const toggle = (id: number, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  const handleSave = () => {
    startTransition(async () => {
      const result = await setOrgMemberPermissionsAction({
        orgUid,
        userId: member.User.userId,
        permissionIds: selected,
      });
      if (result.status) {
        toast.success("Permissions saved.");
        onSaved(member.id, selected);
        setOpen(false);
      } else {
        toast.error(result.message ?? "Failed to save permissions.");
      }
    });
  };

  return (
    <>
      <DropdownMenuItem
        className="gap-2"
        onSelect={(e) => { e.preventDefault(); setOpen(true); }}
      >
        <KeyRound className="h-4 w-4" />
        Manage Permissions
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Member Permissions</DialogTitle>
            <DialogDescription>
              Configure individual permissions for {getFullName(member.User) || member.User.userId}.
              These override role defaults.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-72 pr-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 py-2">
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
              {allPermissions.length === 0 && (
                <p className="text-xs text-muted-foreground col-span-2 py-4 text-center">
                  No ORGANIZATION permissions found.
                </p>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending} className="gap-1.5">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Sub-component: Member Row                                          */
/* ─────────────────────────────────────────────────────────────────── */

interface MemberRowProps {
  member: MemberItem;
  orgUid: string;
  roles: RolesData;
  allPermissions: PermissionsData;
  removingId: number | null;
  pendingStatusId: number | null;
  onStatusChange: (id: number, status: "ACTIVE" | "SUSPENDED" | "INACTIVE") => void;
  onRemove: (id: number) => void;
  onRoleChanged: (memberId: number, newRoleId: number, newRoleName: string) => void;
  onPermissionsSaved: (memberId: number, permissionIds: number[]) => void;
}

function MemberRow({
  member,
  orgUid,
  roles,
  allPermissions,
  removingId,
  pendingStatusId,
  onStatusChange,
  onRemove,
  onRoleChanged,
  onPermissionsSaved,
}: MemberRowProps) {
  const memberIsOwner = isOwnerRole(member.OrganizationRole.name);
  const studentRecord = member.User.StudentRecords?.[0];
  const employmentRecord = member.User.UserEmployments?.[0];

  const subInfo = studentRecord
    ? [
        studentRecord.studentId && `ID: ${studentRecord.studentId}`,
        studentRecord.Program?.name,
        studentRecord.College?.name,
        studentRecord.OrganizationYearLevel?.name ?? studentRecord.Level?.name,
      ]
        .filter(Boolean)
        .join(" · ")
    : employmentRecord
    ? [
        employmentRecord.employeeId && `Emp: ${employmentRecord.employeeId}`,
        employmentRecord.position ?? employmentRecord.designation,
        employmentRecord.Office?.name ?? employmentRecord.Department?.name,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={member.User.picture ?? undefined} />
        <AvatarFallback className="text-xs">
          {getInitials(member.User.firstName, member.User.lastName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {[member.User.firstName, member.User.lastName, member.User.suffix]
            .filter(Boolean)
            .join(" ") || member.User.userId}
        </p>
        <p className="text-xs text-muted-foreground truncate">{member.User.email}</p>
        <div className="flex items-center gap-1 flex-wrap mt-0.5">
          {subInfo && (
            <span className="text-xs text-muted-foreground truncate max-w-xs">{subInfo}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <Shield className="h-3 w-3" />
            {member.OrgMemberPermissions.length}
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
          <Badge variant="outline" className="text-xs hidden sm:flex">
            {member.OrganizationRole.name}
          </Badge>
        )}

        <Badge variant={statusVariant(member.status)} className="text-xs">
          {member.status === "ACTIVE" ? (
            <CheckCircle2 className="h-3 w-3 mr-1" />
          ) : member.status === "PENDING" ? (
            <Loader2 className="h-3 w-3 mr-1" />
          ) : (
            <XCircle className="h-3 w-3 mr-1" />
          )}
          {member.status}
        </Badge>

        {!memberIsOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={removingId === member.id || pendingStatusId === member.id}
              >
                {removingId === member.id || pendingStatusId === member.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate max-w-44">
                {getFullName(member.User) || member.User.userId}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <ChangeRoleMenuItem
                member={member}
                roles={roles}
                onChanged={onRoleChanged}
              />

              <MemberPermissionsMenuItem
                orgUid={orgUid}
                member={member}
                allPermissions={allPermissions}
                onSaved={onPermissionsSaved}
              />

              <DropdownMenuSeparator />

              {member.status === "PENDING" && (
                <>
                  <DropdownMenuItem
                    className="gap-2 text-emerald-600 focus:text-emerald-600"
                    onSelect={() => onStatusChange(member.id, "ACTIVE")}
                  >
                    <UserCheck className="h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive"
                    onSelect={() => onStatusChange(member.id, "INACTIVE")}
                  >
                    <UserX className="h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {member.status === "ACTIVE" && (
                <DropdownMenuItem
                  className="gap-2 text-amber-600 focus:text-amber-600"
                  onSelect={() => onStatusChange(member.id, "SUSPENDED")}
                >
                  <UserX className="h-4 w-4" />
                  Suspend
                </DropdownMenuItem>
              )}

              {member.status === "SUSPENDED" && (
                <DropdownMenuItem
                  className="gap-2 text-emerald-600 focus:text-emerald-600"
                  onSelect={() => onStatusChange(member.id, "ACTIVE")}
                >
                  <UserCheck className="h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className="text-destructive gap-2 focus:text-destructive"
                disabled={removingId === member.id}
                onSelect={() => onRemove(member.id)}
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
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main Component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export function OrgMembersClient({
  orgUid,
  orgName,
  initialMembers,
  totalCount: initialTotal,
  roles,
  allPermissions,
}: OrgMembersClientProps) {
  const [members, setMembers] = useState<MembersData>(initialMembers);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);

  /* ── Derived filtered list ─────────────────────────────────── */
  const filtered = members.filter((m) => {
    if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
    if (roleFilter !== "ALL" && m.OrganizationRole.name !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = getFullName(m.User).toLowerCase();
      const studentId = m.User.StudentRecords?.[0]?.studentId?.toLowerCase() ?? "";
      if (!name.includes(q) && !studentId.includes(q) && !m.User.userId.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  /* ── Status counts for tabs ────────────────────────────────── */
  const counts: Record<StatusFilter, number> = {
    ALL: members.length,
    ACTIVE: members.filter((m) => m.status === "ACTIVE").length,
    PENDING: members.filter((m) => m.status === "PENDING").length,
    SUSPENDED: members.filter((m) => m.status === "SUSPENDED").length,
    INACTIVE: members.filter((m) => m.status === "INACTIVE").length,
  };

  /* ── Handlers ──────────────────────────────────────────────── */

  const handleAdded = (member: MemberItem) => {
    setMembers((prev) => [...prev, member]);
  };

  const handleRoleChanged = (memberId: number, newRoleId: number, newRoleName: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, role: newRoleId, OrganizationRole: { ...m.OrganizationRole, id: newRoleId, name: newRoleName } }
          : m,
      ),
    );
  };

  const handlePermissionsSaved = (memberId: number, permissionIds: number[]) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, OrgMemberPermissions: permissionIds.map((id) => ({ permissionId: id })) }
          : m,
      ),
    );
  };

  const handleStatusChange = (id: number, status: "ACTIVE" | "SUSPENDED" | "INACTIVE") => {
    setPendingStatusId(id);
    const doUpdate = async () => {
      const result = await setMembershipRequestStatusAction(id, status);
      if (result.status) {
        toast.success(`Member ${status.toLowerCase()}.`);
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      } else {
        toast.error(result.message ?? "Failed to update member status.");
      }
      setPendingStatusId(null);
    };
    doUpdate();
  };

  const handleRemove = (id: number) => {
    setRemovingId(id);
    const doRemove = async () => {
      const result = await deleteMembershipAction(id);
      if (result.status) {
        toast.success("Member removed.");
        setMembers((prev) => prev.filter((m) => m.id !== id));
      } else {
        toast.error(result.message ?? "Failed to remove member.");
      }
      setRemovingId(null);
    };
    doRemove();
  };

  const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "PENDING", label: "Pending" },
    { value: "SUSPENDED", label: "Suspended" },
    { value: "INACTIVE", label: "Inactive" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Members
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage members of <span className="font-medium">{orgName}</span>
          </p>
        </div>
        <AddMemberDialog orgUid={orgUid} roles={roles} onAdded={handleAdded} />
      </div>

      {/* ── Search + Role Filter ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8"
            placeholder="Search by name or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.name}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Status Tabs ─────────────────────────────────────── */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
      >
        <TabsList className="h-auto flex-wrap overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
              {tab.label}
              {counts[tab.value] > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold">
                  {counts[tab.value]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ── Members List ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {statusFilter === "ALL" ? "All Members" : `${statusFilter} Members`}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {filtered.length} of {members.length}
            </Badge>
          </div>
          {statusFilter === "PENDING" && filtered.length > 0 && (
            <CardDescription className="text-amber-600 dark:text-amber-400">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""} awaiting approval.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">
                {searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL"
                  ? "No members match your filters."
                  : "No members found for this organization."}
              </p>
            </div>
          ) : (
            filtered.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                orgUid={orgUid}
                roles={roles}
                allPermissions={allPermissions}
                removingId={removingId}
                pendingStatusId={pendingStatusId}
                onStatusChange={handleStatusChange}
                onRemove={handleRemove}
                onRoleChanged={handleRoleChanged}
                onPermissionsSaved={handlePermissionsSaved}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
