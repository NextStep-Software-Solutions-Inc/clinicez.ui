"use client";

import { useCallback, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Trash2,
  UserCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  getOrgMembersAction,
  setMembershipRequestStatusAction,
  deleteMembershipAction,
  type GetOrgMembers,
} from "@/actions/organizations/org-member.action";
import type { GetOrganizationRoles } from "@/actions/organizations/organization-role.action";
import type { OrganizationMemberStatus } from "@/types";

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                       */
/* ─────────────────────────────────────────────────────────── */

type OrgMember = NonNullable<NonNullable<GetOrgMembers["data"]>["data"]>[number];

type OrgRole = NonNullable<NonNullable<GetOrganizationRoles["data"]>>[number];

export interface OrgMembersClientProps {
  orgUid: string;
  initialMembers: OrgMember[];
  initialTotal: number;
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
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  return (first + last).toUpperCase() || "?";
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
/*  Component                                                   */
/* ─────────────────────────────────────────────────────────── */

export function OrgMembersClient({
  orgUid,
  initialMembers,
  initialTotal,
  roles,
  pageSize = 20,
}: OrgMembersClientProps) {
  const [members, setMembers] = useState<OrgMember[]>(initialMembers);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrganizationMemberStatus | "ALL">("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [actioningId, setActioningId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /* ── Data fetching ─────────────────────────────────────── */

  const fetchMembers = useCallback(
    (
      nextPage: number,
      nextSearch: string,
      nextStatus: OrganizationMemberStatus | "ALL",
      nextRole: string
    ) => {
      startTransition(async () => {
        const result = await getOrgMembersAction({
          orgUid,
          pageNumber: nextPage,
          pageSize,
          searchKey: nextSearch || undefined,
          status: nextStatus !== "ALL" ? [nextStatus] : undefined,
          role: nextRole !== "ALL" ? [nextRole] : undefined,
        });

        if (result.status && result.data) {
          setMembers(result.data.data);
          setTotal(result.data.total);
        }
      });
    },
    [orgUid, pageSize]
  );

  /* ── Filter handlers ───────────────────────────────────── */

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
      fetchMembers(1, value, statusFilter, roleFilter);
    },
    [fetchMembers, statusFilter, roleFilter]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value as OrganizationMemberStatus | "ALL";
      setStatusFilter(status);
      setPage(1);
      fetchMembers(1, search, status, roleFilter);
    },
    [fetchMembers, search, roleFilter]
  );

  const handleRoleChange = useCallback(
    (value: string) => {
      setRoleFilter(value);
      setPage(1);
      fetchMembers(1, search, statusFilter, value);
    },
    [fetchMembers, search, statusFilter]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      fetchMembers(nextPage, search, statusFilter, roleFilter);
    },
    [fetchMembers, search, statusFilter, roleFilter]
  );

  /* ── Member actions ────────────────────────────────────── */

  const handleStatusUpdate = useCallback(
    async (memberId: number, status: OrganizationMemberStatus) => {
      setActioningId(memberId);
      const result = await setMembershipRequestStatusAction(memberId, status);
      setActioningId(null);

      if (result.status) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, status } : m))
        );
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
    }
  }, []);

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="space-y-4 pb-10">
      {/* ── Header ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Organization Members</CardTitle>
            </div>
            <CardDescription>
              {total} member{total !== 1 ? "s" : ""} in total
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

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
          </div>
        </CardContent>
      </Card>

      {/* ── Member List ─────────────────────────────────── */}
      <div className="space-y-2">
        {isPending && (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading members…
          </div>
        )}

        {!isPending && members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No members found
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {!isPending &&
          members.map((member) => {
            const status = member.status as OrganizationMemberStatus;
            const badge = STATUS_BADGE[status] ?? STATUS_BADGE.INACTIVE;
            const fullName = getFullName(
              member.User.firstName,
              member.User.lastName,
              member.User.suffix
            );
            const initials = getInitials(
              member.User.firstName,
              member.User.lastName
            );
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
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage
                        src={member.User.picture ?? undefined}
                        alt={fullName}
                      />
                      <AvatarFallback className="text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {fullName}
                        </span>
                        <Badge variant={badge.variant} className="text-xs">
                          {badge.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {member.OrganizationRole.name}
                        </span>
                        {studentRecord && (
                          <span className="text-xs text-muted-foreground">
                            ID: {studentRecord.studentId}
                          </span>
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

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          disabled={isActioning}
                        >
                          <MoreHorizontal className="h-4 w-4" />
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
                              onClick={() =>
                                handleStatusUpdate(member.id, "ACTIVE")
                              }
                              className="gap-2 text-green-600 focus:text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(member.id, "INACTIVE")
                              }
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}

                        {status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(member.id, "SUSPENDED")
                            }
                            className="gap-2"
                          >
                            <Pause className="h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        )}

                        {status === "SUSPENDED" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(member.id, "ACTIVE")
                            }
                            className="gap-2 text-green-600 focus:text-green-600"
                          >
                            <Play className="h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}

                        {status === "INACTIVE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(member.id, "ACTIVE")
                            }
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
      </div>

      {/* ── Pagination ──────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1 || isPending}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages || isPending}
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
