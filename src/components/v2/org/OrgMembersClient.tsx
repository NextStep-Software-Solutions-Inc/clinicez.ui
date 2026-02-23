"use client";

import {
  useCallback,
  useState,
  useTransition,
  useRef,
  useEffect,
} from "react";
import { format } from "date-fns";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Trash2,
  UserCircle,
  UserPlus,
  Loader2,
  ClipboardList,
  Eye,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  getOrgMembersAction,
  setMembershipRequestStatusAction,
  deleteMembershipAction,
  searchUsersForOrgAction,
  type GetOrgMembers,
  type SearchUsersForOrg,
} from "@/actions/organizations/org-member.action";
import { joinOrganizationAction } from "@/actions/organizations/join-organization.action";
import type { GetOrganizationRoles } from "@/actions/organizations/organization-role.action";
import type { OrganizationMemberStatus } from "@/types";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                       */
/* ─────────────────────────────────────────────────────────── */

type OrgMember = NonNullable<NonNullable<GetOrgMembers["data"]>["data"]>[number];
type OrgRole = NonNullable<NonNullable<GetOrganizationRoles["data"]>>[number];
type UserResult = NonNullable<NonNullable<SearchUsersForOrg["data"]>>[number];

export interface OrgMembersClientProps {
  orgUid: string;
  initialMembers: OrgMember[];
  initialTotal: number;
  initialNextCursor: number | null;
  initialHasMore: boolean;
  roles: OrgRole[];
  pageSize?: number;
}

/* ─────────────────────────────────────────────────────────── */
/*  Constants                                                   */
/* ─────────────────────────────────────────────────────────── */

const STATUS_OPTIONS: { label: string; value: OrganizationMemberStatus | "ALL" }[] = [
  { label: "All Statuses", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Inactive", value: "INACTIVE" },
];

const STATUS_BADGE: Record<
  OrganizationMemberStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Active", variant: "default" },
  PENDING: { label: "Pending", variant: "secondary" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
  INACTIVE: { label: "Inactive", variant: "outline" },
};

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                     */
/* ─────────────────────────────────────────────────────────── */

function getInitials(firstName: string | null, lastName: string | null): string {
  return ((firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "")).toUpperCase() || "?";
}

function getFullName(
  firstName: string | null,
  lastName: string | null,
  suffix?: string | null
): string {
  const parts = [firstName, lastName].filter(Boolean).join(" ");
  return suffix ? `${parts} ${suffix}` : parts || "Unknown User";
}

/* ─────────────────────────────────────────────────────────── */
/*  Requirement constants + helpers                             */
/* ─────────────────────────────────────────────────────────── */

const REQUIREMENT_STUDENT_RECORD = "student_record";
const REQUIREMENT_EMPLOYEE_RECORD = "employee_record";

/** Human-readable labels for known requirement keys */
const REQUIREMENT_LABEL_MAP: Record<string, string> = {
  [REQUIREMENT_STUDENT_RECORD]: "Student Record",
  [REQUIREMENT_EMPLOYEE_RECORD]: "Employee Record",
};

function formatRequirementLabel(req: string): string {
  return (
    REQUIREMENT_LABEL_MAP[req] ??
    req.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Member Application Sheet (view filled requirements)        */
/* ─────────────────────────────────────────────────────────── */

interface MemberApplicationSheetProps {
  member: OrgMember | null;
  onClose: () => void;
}

function MemberApplicationSheet({ member, onClose }: MemberApplicationSheetProps) {
  if (!member) return null;

  const requirements: string[] = member.OrganizationRole.requirements ?? [];
  const studentRecord = member.User.StudentRecords?.[0];
  const employment = member.User.UserEmployments?.[0];
  const fullName = getFullName(member.User.firstName, member.User.lastName, member.User.suffix);
  const initials = getInitials(member.User.firstName, member.User.lastName);

  /** Returns whether a requirement key has been fulfilled */
  function isFulfilled(req: string): boolean {
    if (req === REQUIREMENT_STUDENT_RECORD) return studentRecord !== undefined;
    if (req === REQUIREMENT_EMPLOYEE_RECORD) return employment !== undefined;
    return false;
  }

  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-y-auto">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Membership Application
          </SheetTitle>
          <SheetDescription>
            Requirements review for <span className="font-medium text-foreground">{fullName}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 p-6 space-y-6">
          {/* Applicant overview */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={member.User.picture ?? undefined} alt={fullName} />
              <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{fullName}</p>
              <p className="text-sm text-muted-foreground">{member.OrganizationRole.name}</p>
              <p className="text-xs text-muted-foreground">
                Applied {format(new Date(member.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <Separator />

          {/* Role description */}
          {member.OrganizationRole.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Role Description</p>
              <p className="text-sm text-muted-foreground">{member.OrganizationRole.description}</p>
            </div>
          )}

          {/* Requirements checklist */}
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Joining Requirements
            </p>

            {requirements.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No requirements for this role.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {requirements.map((req) => {
                  const fulfilled = isFulfilled(req);
                  return (
                    <div
                      key={req}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${
                        fulfilled
                          ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20"
                          : "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20"
                      }`}
                    >
                      {fulfilled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{formatRequirementLabel(req)}</p>
                        <p className={`text-xs mt-0.5 ${fulfilled ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
                          {fulfilled ? "Submitted" : "Not yet submitted"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student record details */}
          {studentRecord && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Student Record
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {studentRecord.studentId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Student ID</span>
                    <span className="font-medium">{studentRecord.studentId}</span>
                  </div>
                )}
                {studentRecord.lrn && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">LRN</span>
                    <span className="font-medium">{studentRecord.lrn}</span>
                  </div>
                )}
                {studentRecord.Level && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium">{studentRecord.Level.name}</span>
                  </div>
                )}
                {studentRecord.OrganizationYearLevel && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Year Level</span>
                    <span className="font-medium">{studentRecord.OrganizationYearLevel.name}</span>
                  </div>
                )}
                {studentRecord.Program && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Program</span>
                    <span className="font-medium">{studentRecord.Program.name}</span>
                  </div>
                )}
                {studentRecord.Department && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium">{studentRecord.Department.name}</span>
                  </div>
                )}
                {studentRecord.College && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">College</span>
                    <span className="font-medium">{studentRecord.College.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Employment record details */}
          {employment && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Employment Record
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {employment.employeeId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Employee ID</span>
                    <span className="font-medium">{employment.employeeId}</span>
                  </div>
                )}
                {employment.position && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Position</span>
                    <span className="font-medium">{employment.position}</span>
                  </div>
                )}
                {employment.designation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Designation</span>
                    <span className="font-medium">{employment.designation}</span>
                  </div>
                )}
                {employment.Office && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Office</span>
                    <span className="font-medium">{employment.Office.name}</span>
                  </div>
                )}
                {employment.Department && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium">{employment.Department.name}</span>
                  </div>
                )}
                {employment.College && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">College</span>
                    <span className="font-medium">{employment.College.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Add Member Sheet                                            */
/* ─────────────────────────────────────────────────────────── */

interface AddMemberSheetProps {
  open: boolean;
  orgUid: string;
  roles: OrgRole[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddMemberSheet({ open, orgUid, roles, onClose, onSuccess }: AddMemberSheetProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const requirements: string[] = selectedRole?.requirements ?? [];

  const resetState = () => {
    setQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setSelectedRoleId(null);
    setShowDropdown(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setSelectedUser(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const result = await searchUsersForOrgAction(orgUid, value.trim());
      setIsSearching(false);
      if (result.status && result.data) {
        setSearchResults(result.data);
        setShowDropdown(true);
      }
    }, 300);
  }, [orgUid]);

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user);
    setQuery(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email);
    setShowDropdown(false);
  };

  const handleAdd = async () => {
    if (!selectedUser) { toast.error("Please select a user."); return; }
    if (!selectedRoleId) { toast.error("Please select a role."); return; }
    setIsAdding(true);
    const result = await joinOrganizationAction({
      userId: selectedUser.userId,
      orgUid,
      orgRoleId: selectedRoleId,
    });
    setIsAdding(false);
    if (result.status) {
      toast.success("Membership request sent successfully.");
      resetState();
      onSuccess();
      onClose();
    } else {
      toast.error(result.message ?? "Failed to add member.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Member
          </SheetTitle>
          <SheetDescription>
            Search for a user and select their role in the organization.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search User</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Name or email…"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                autoComplete="off"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div className="rounded-md border bg-background shadow-md overflow-hidden">
                {searchResults.map((user) => (
                  <button
                    key={user.userId}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left transition-colors"
                    onMouseDown={() => handleSelectUser(user)}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={user.picture ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getFullName(user.firstName, user.lastName)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && searchResults.length === 0 && !isSearching && (
              <p className="text-sm text-muted-foreground px-1">No users found.</p>
            )}
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={selectedRoleId?.toString() ?? ""}
              onValueChange={(v) => setSelectedRoleId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role…" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role requirements */}
          {selectedRole && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="h-4 w-4 text-primary" />
                Requirements for <span className="text-primary">{selectedRole.name}</span>
              </div>
              {requirements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No additional requirements for this role.
                </p>
              ) : (
                <ul className="space-y-1">
                  {requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="capitalize">{req.replaceAll("_", " ")}</span>
                    </li>
                  ))}
                </ul>
              )}
              {selectedRole.description && (
                <p className="text-xs text-muted-foreground border-t pt-3 mt-2">
                  {selectedRole.description}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isAdding}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={handleAdd}
              disabled={isAdding || !selectedUser || !selectedRoleId}
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Add Member
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Main Component                                             */
/* ─────────────────────────────────────────────────────────── */

export function OrgMembersClient({
  orgUid,
  initialMembers,
  initialTotal,
  initialNextCursor,
  initialHasMore,
  roles,
  pageSize = 20,
}: OrgMembersClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ── Filter state (synced to URL) ────────────────────────────────────
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<OrganizationMemberStatus | "ALL">(
    () => (searchParams.get("status") as OrganizationMemberStatus | "ALL") ?? "ALL"
  );
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get("role") ?? "ALL");

  // ── Cursor / list state ─────────────────────────────────────────────
  const [members, setMembers] = useState<OrgMember[]>(initialMembers);
  const [total, setTotal] = useState(initialTotal);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);

  // ── Loading flags ───────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, startLoadMoreTransition] = useTransition();
  const [actioningId, setActioningId] = useState<number | null>(null);

  // ── Sheet state ─────────────────────────────────────────────────────
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [applicationMember, setApplicationMember] = useState<OrgMember | null>(null);

  // ── Refs for scroll-based load more (always current values) ────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const nextCursorRef = useRef(nextCursor);
  const searchRef = useRef(search);
  const statusRef = useRef(statusFilter);
  const roleRef = useRef(roleFilter);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isLoadingMoreRef.current = isLoadingMore; }, [isLoadingMore]);
  useEffect(() => { nextCursorRef.current = nextCursor; }, [nextCursor]);
  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => { statusRef.current = statusFilter; }, [statusFilter]);
  useEffect(() => { roleRef.current = roleFilter; }, [roleFilter]);

  // ── URL sync: persist filters only (skip first mount) ─────────────
  const isFirstSync = useRef(true);
  useEffect(() => {
    if (isFirstSync.current) { isFirstSync.current = false; return; }
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, statusFilter, roleFilter, pathname, router]);

  // ── Full reload when filters change ────────────────────────────────
  const fetchFresh = useCallback(
    async (searchQuery: string, status: OrganizationMemberStatus | "ALL", role: string) => {
      setIsLoading(true);
      try {
        const result = await getOrgMembersAction({
          orgUid,
          pageSize,
          searchKey: searchQuery || undefined,
          status: status !== "ALL" ? [status] : undefined,
          role: role !== "ALL" ? [role] : undefined,
        });
        if (result.status && result.data) {
          setMembers(result.data.data);
          setTotal(result.data.total);
          setNextCursor(result.data.nextCursor);
          setHasMore(result.data.hasMore);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [orgUid, pageSize]
  );

  // ── Load more (cursor-based, uses refs to avoid stale closures) ─────
  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || isLoadingMoreRef.current || !nextCursorRef.current) return;
    startLoadMoreTransition(async () => {
      const result = await getOrgMembersAction({
        orgUid,
        pageSize,
        cursor: nextCursorRef.current ?? undefined,
        searchKey: searchRef.current || undefined,
        status: statusRef.current !== "ALL" ? [statusRef.current] : undefined,
        role: roleRef.current !== "ALL" ? [roleRef.current] : undefined,
      });
      if (result.status && result.data) {
        setMembers((prev) => [...prev, ...result.data!.data]);
        setNextCursor(result.data.nextCursor);
        setHasMore(result.data.hasMore);
        setTotal(result.data.total);
      }
    });
  }, [orgUid, pageSize]);

  // ── IntersectionObserver for infinite scroll ───────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const scrollRoot = sentinel.closest<HTMLElement>("[data-scroll-root]");
    if (!scrollRoot) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollRoot;
      if (
        scrollHeight - scrollTop - clientHeight < 300 &&
        hasMoreRef.current &&
        !isLoadingMoreRef.current
      ) {
        loadMore();
      }
    };

    scrollRoot.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scrollRoot.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  // ── Filter handlers ─────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    fetchFresh(value, statusFilter, roleFilter);
  }, [fetchFresh, statusFilter, roleFilter]);

  const handleStatusChange = useCallback((value: string) => {
    const s = value as OrganizationMemberStatus | "ALL";
    setStatusFilter(s);
    fetchFresh(search, s, roleFilter);
  }, [fetchFresh, search, roleFilter]);

  const handleRoleChange = useCallback((value: string) => {
    setRoleFilter(value);
    fetchFresh(search, statusFilter, value);
  }, [fetchFresh, search, statusFilter]);

  // ── Member actions ──────────────────────────────────────────────────
  const handleStatusUpdate = useCallback(
    async (memberId: number, status: OrganizationMemberStatus) => {
      setActioningId(memberId);
      const result = await setMembershipRequestStatusAction(memberId, status);
      setActioningId(null);
      if (result.status) {
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, status } : m)));
        toast.success(`Member status updated to ${status.toLowerCase()}.`);
      } else {
        toast.error(result.message ?? "Failed to update status.");
      }
    },
    []
  );

  const handleRemove = useCallback(async (memberId: number) => {
    setActioningId(memberId);
    const result = await deleteMembershipAction(memberId);
    setActioningId(null);
    if (result.status) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setTotal((prev) => prev - 1);
      toast.success("Member removed.");
    } else {
      toast.error(result.message ?? "Failed to remove member.");
    }
  }, []);

  const handleAddSuccess = useCallback(() => {
    fetchFresh(search, statusFilter, roleFilter);
  }, [fetchFresh, search, statusFilter, roleFilter]);

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-0 pb-10">
      {/* ── Sticky filter bar ───────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/50 px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Role filter */}
          <Select value={roleFilter} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.name}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add member */}
          <Button
            className="gap-1.5 flex-shrink-0"
            onClick={() => setAddSheetOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        {/* Counter */}
        <p className="text-xs text-muted-foreground mt-2">
          Showing {members.length} of {total} member{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Member list ──────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-3 space-y-2">
        {/* Full reload spinner */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No members found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Members */}
        {!isLoading &&
          members.map((member) => {
            const status = member.status as OrganizationMemberStatus;
            const badge = STATUS_BADGE[status] ?? STATUS_BADGE.INACTIVE;
            const fullName = getFullName(member.User.firstName, member.User.lastName, member.User.suffix);
            const initials = getInitials(member.User.firstName, member.User.lastName);
            const studentRecord = member.User.StudentRecords?.[0];
            const employment = member.User.UserEmployments?.[0];
            const isActioning = actioningId === member.id;

            return (
              <Card
                key={member.id}
                className="border transition-colors hover:border-primary/30"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={member.User.picture ?? undefined} alt={fullName} />
                      <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm truncate">{fullName}</span>
                        <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">{member.OrganizationRole.name}</span>
                        {studentRecord && (
                          <span className="text-xs text-muted-foreground">ID: {studentRecord.studentId}</span>
                        )}
                        {employment && (
                          <span className="text-xs text-muted-foreground">
                            {employment.position ?? employment.designation ?? "Employee"}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Joined {format(new Date(member.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          disabled={isActioning}
                        >
                          {isActioning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                          <span className="sr-only">Member actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                          {fullName}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {status === "PENDING" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setApplicationMember(member)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Application
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "ACTIVE")}
                              className="gap-2 text-green-600 focus:text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "INACTIVE")}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(member.id, "SUSPENDED")}
                            className="gap-2"
                          >
                            <Pause className="h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {status === "SUSPENDED" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(member.id, "ACTIVE")}
                            className="gap-2 text-green-600 focus:text-green-600"
                          >
                            <Play className="h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {status === "INACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(member.id, "ACTIVE")}
                            className="gap-2 text-green-600 focus:text-green-600"
                          >
                            <Play className="h-4 w-4" />
                            Re-activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemove(member.id)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        {/* Sentinel + loading more indicator */}
        <div ref={sentinelRef} className="h-4" />
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more members…
          </div>
        )}
        {!isLoadingMore && !hasMore && members.length > 0 && !isLoading && (
          <p className="text-center text-xs text-muted-foreground py-4">
            All {total} member{total !== 1 ? "s" : ""} loaded
          </p>
        )}
      </div>

      {/* ── Add Member Sheet ─────────────────────────────────── */}
      <AddMemberSheet
        open={addSheetOpen}
        orgUid={orgUid}
        roles={roles}
        onClose={() => setAddSheetOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* ── Member Application Sheet ─────────────────────────── */}
      <MemberApplicationSheet
        member={applicationMember}
        onClose={() => setApplicationMember(null)}
      />
    </div>
  );
}
