"use client";

import React, { useState, useTransition, useCallback, useRef } from "react";
import {
  Activity,
  Filter,
  Loader2,
  RefreshCw,
  ChevronDown,
  Shield,
  Users,
  Building2,
  UserCog,
  LogIn,
  LogOut,
  PlusCircle,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { $Enums } from "@prisma/client";
import {
  getOrgActivitiesAction,
  type GetOrgActivities,
} from "@/actions/organizations/org-activities.action";

type ActivityItem = NonNullable<GetOrgActivities["data"]>["items"][number];
type OrgInfo = NonNullable<GetOrgActivities["data"]>["org"];

interface OrgActivitiesClientProps {
  orgUid: string;
  initialItems: ActivityItem[];
  initialTotal: number;
  initialHasMore: boolean;
  initialNextCursor: number | null;
  org: OrgInfo;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function formatFull(date: Date | string): string {
  return new Date(date).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Action config ────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  $Enums.AuditAction,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  CREATE: {
    label: "Created",
    icon: <PlusCircle className="h-3.5 w-3.5" />,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  },
  UPDATE: {
    label: "Updated",
    icon: <Pencil className="h-3.5 w-3.5" />,
    color: "text-sky-600",
    bg: "bg-sky-500/10 text-sky-700 border-sky-200",
  },
  DELETE: {
    label: "Deleted",
    icon: <Trash2 className="h-3.5 w-3.5" />,
    color: "text-rose-600",
    bg: "bg-rose-500/10 text-rose-700 border-rose-200",
  },
  PERMISSION_GRANT: {
    label: "Permission Granted",
    icon: <Shield className="h-3.5 w-3.5" />,
    color: "text-violet-600",
    bg: "bg-violet-500/10 text-violet-700 border-violet-200",
  },
  PERMISSION_REVOKE: {
    label: "Permission Revoked",
    icon: <Shield className="h-3.5 w-3.5" />,
    color: "text-orange-600",
    bg: "bg-orange-500/10 text-orange-700 border-orange-200",
  },
  STATUS_CHANGE: {
    label: "Status Changed",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: "text-amber-600",
    bg: "bg-amber-500/10 text-amber-700 border-amber-200",
  },
  ONBOARDING: {
    label: "Onboarding",
    icon: <UserCog className="h-3.5 w-3.5" />,
    color: "text-teal-600",
    bg: "bg-teal-500/10 text-teal-700 border-teal-200",
  },
  JOIN: {
    label: "Joined",
    icon: <LogIn className="h-3.5 w-3.5" />,
    color: "text-green-600",
    bg: "bg-green-500/10 text-green-700 border-green-200",
  },
  LEAVE: {
    label: "Left",
    icon: <LogOut className="h-3.5 w-3.5" />,
    color: "text-gray-600",
    bg: "bg-gray-500/10 text-gray-700 border-gray-200",
  },
  CLAIM: {
    label: "Claimed",
    icon: <UserCog className="h-3.5 w-3.5" />,
    color: "text-indigo-600",
    bg: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  },
};

const ENTITY_CONFIG: Record<
  $Enums.AuditEntityType,
  { label: string; icon: React.ReactNode }
> = {
  USER: { label: "User", icon: <Users className="h-3.5 w-3.5" /> },
  PATIENT: { label: "Patient", icon: <Users className="h-3.5 w-3.5" /> },
  ORGANIZATION: { label: "Organization", icon: <Building2 className="h-3.5 w-3.5" /> },
  CLINIC: { label: "Clinic", icon: <Building2 className="h-3.5 w-3.5" /> },
  PERMISSION: { label: "Permission", icon: <Shield className="h-3.5 w-3.5" /> },
  CLINIC_MEMBER: { label: "Clinic Member", icon: <UserCog className="h-3.5 w-3.5" /> },
  ORG_MEMBER: { label: "Org Member", icon: <UserCog className="h-3.5 w-3.5" /> },
  PROVIDER: { label: "Provider", icon: <UserCog className="h-3.5 w-3.5" /> },
  ONBOARDING: { label: "Onboarding", icon: <UserCog className="h-3.5 w-3.5" /> },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivityRow({ item }: { item: ActivityItem }) {
  const actionCfg = ACTION_CONFIG[item.action];
  const entityCfg = ENTITY_CONFIG[item.entityType];
  const performerName = item.Performer
    ? `${item.Performer.firstName ?? ""} ${item.Performer.lastName ?? ""}`.trim() ||
      item.Performer.email
    : "System";

  const initials = item.Performer
    ? `${item.Performer.firstName?.[0] ?? ""}${item.Performer.lastName?.[0] ?? ""}`.toUpperCase() ||
      "?"
    : "SY";

  return (
    <div className="flex gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors group">
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        {item.Performer?.picture && (
          <AvatarImage src={item.Performer.picture} alt={performerName ?? ""} />
        )}
        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-medium text-foreground">{performerName}</span>
          <Badge
            variant="outline"
            className={`flex items-center gap-1 text-xs px-1.5 py-0.5 ${actionCfg.bg}`}
          >
            {actionCfg.icon}
            {actionCfg.label}
          </Badge>
          <span className="text-muted-foreground text-xs flex items-center gap-1">
            {entityCfg.icon}
            {entityCfg.label}
            <span className="font-mono text-[10px] opacity-60">#{item.entityId}</span>
          </span>
        </div>

        {/* Field change details */}
        {item.fieldName && (
          <div className="text-xs text-muted-foreground flex flex-wrap gap-1.5 items-center">
            <span className="font-mono bg-muted px-1 rounded">{item.fieldName}</span>
            {item.previousValue && (
              <>
                <span className="line-through text-rose-500/80 font-mono truncate max-w-[120px]">
                  {item.previousValue}
                </span>
                <span className="text-muted-foreground">→</span>
              </>
            )}
            {item.newValue && (
              <span className="text-emerald-600 font-mono truncate max-w-[120px]">
                {item.newValue}
              </span>
            )}
          </div>
        )}

        {/* Reason */}
        {item.reason && (
          <p className="text-xs text-muted-foreground italic">"{item.reason}"</p>
        )}
      </div>

      {/* Timestamp */}
      <div
        className="flex-shrink-0 text-xs text-muted-foreground text-right whitespace-nowrap"
        title={formatFull(item.performedAt)}
      >
        {formatRelative(item.performedAt)}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrgActivitiesClient({
  orgUid,
  initialItems,
  initialTotal,
  initialHasMore,
  initialNextCursor,
  org,
}: OrgActivitiesClientProps) {
  const [items, setItems] = useState<ActivityItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);

  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const filtersRef = useRef({ actionFilter, entityFilter, fromDate, toDate });

  const buildParams = useCallback(
    (
      overrides: Partial<{
        action: string;
        entity: string;
        from: string;
        to: string;
        cursor: number | null;
      }> = {}
    ) => {
      const a = overrides.action ?? filtersRef.current.actionFilter;
      const e = overrides.entity ?? filtersRef.current.entityFilter;
      const f = overrides.from !== undefined ? overrides.from : filtersRef.current.fromDate;
      const t = overrides.to !== undefined ? overrides.to : filtersRef.current.toDate;
      return {
        orgUid,
        action: a !== "all" ? (a as $Enums.AuditAction) : undefined,
        entityType: e !== "all" ? (e as $Enums.AuditEntityType) : undefined,
        from: f || undefined,
        to: t || undefined,
        cursor: overrides.cursor ?? undefined,
        pageSize: 25,
      };
    },
    [orgUid]
  );

  const applyFilters = useCallback(
    (overrides: Partial<{ action: string; entity: string; from: string; to: string }> = {}) => {
      filtersRef.current = {
        actionFilter: overrides.action ?? actionFilter,
        entityFilter: overrides.entity ?? entityFilter,
        fromDate: overrides.from !== undefined ? overrides.from : fromDate,
        toDate: overrides.to !== undefined ? overrides.to : toDate,
      };

      startTransition(async () => {
        const result = await getOrgActivitiesAction(buildParams(overrides));
        if (result.status && result.data) {
          setItems(result.data.items);
          setTotal(result.data.total);
          setHasMore(result.data.hasMore);
          setNextCursor(result.data.nextCursor);
        } else {
          toast.error(result.message ?? "Failed to load activities");
        }
      });
    },
    [actionFilter, entityFilter, fromDate, toDate, buildParams]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    startTransition(async () => {
      const result = await getOrgActivitiesAction(buildParams({ cursor: nextCursor }));
      setIsLoadingMore(false);
      if (result.status && result.data) {
        setItems((prev) => [...prev, ...result.data!.items]);
        setHasMore(result.data.hasMore);
        setNextCursor(result.data.nextCursor);
      } else {
        toast.error(result.message ?? "Failed to load more activities");
      }
    });
  }, [hasMore, nextCursor, isLoadingMore, buildParams]);

  const handleActionChange = (val: string) => {
    setActionFilter(val);
    applyFilters({ action: val });
  };

  const handleEntityChange = (val: string) => {
    setEntityFilter(val);
    applyFilters({ entity: val });
  };

  const handleDateApply = () => {
    applyFilters({ from: fromDate, to: toDate });
  };

  const handleReset = () => {
    setActionFilter("all");
    setEntityFilter("all");
    setFromDate("");
    setToDate("");
    filtersRef.current = { actionFilter: "all", entityFilter: "all", fromDate: "", toDate: "" };
    applyFilters({ action: "all", entity: "all", from: "", to: "" });
  };

  const todayStr = toInputDate(new Date());

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Organization Activities
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {org.name} · {total.toLocaleString()} total{" "}
            {total === 1 ? "event" : "events"}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => applyFilters()}
          disabled={isPending}
          className="gap-1.5 self-start"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Action filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Action</label>
              <Select value={actionFilter} onValueChange={handleActionChange}>
                <SelectTrigger className="h-8 w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {(Object.keys(ACTION_CONFIG) as $Enums.AuditAction[]).map((a) => (
                    <SelectItem key={a} value={a}>
                      {ACTION_CONFIG[a].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity type filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Entity</label>
              <Select value={entityFilter} onValueChange={handleEntityChange}>
                <SelectTrigger className="h-8 w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="ORGANIZATION">Organization</SelectItem>
                  <SelectItem value="ORG_MEMBER">Org Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={fromDate}
                max={toDate || todayStr}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 w-36 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                value={toDate}
                min={fromDate}
                max={todayStr}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 w-36 text-sm"
              />
            </div>

            <Button size="sm" variant="secondary" onClick={handleDateApply} className="h-8">
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 text-muted-foreground">
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Activity Feed ── */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Activity Feed
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin ml-1 text-muted-foreground" />}
          </CardTitle>
        </CardHeader>

        <div className="divide-y">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No activity found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            items.map((item) => <ActivityRow key={item.id} item={item} />)
          )}
        </div>

        {/* Load more */}
        {hasMore && items.length > 0 && (
          <div className="px-4 py-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-muted-foreground"
              onClick={loadMore}
              disabled={isLoadingMore || isPending}
            >
              {isLoadingMore ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Load more
            </Button>
          </div>
        )}

        {/* Footer count */}
        {items.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground text-center">
              Showing {items.length.toLocaleString()} of {total.toLocaleString()}{" "}
              {total === 1 ? "event" : "events"}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
