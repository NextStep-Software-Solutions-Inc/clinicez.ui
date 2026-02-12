"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  UserPlus,
  FileEdit,
  Stethoscope,
  ShieldCheck,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAuditLogs } from "@/actions/audit.action";
import { EntityType, AuditActionType } from "@prisma/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface TimelineTabProps {
  patientId: number;
  clinicId: number;
}

interface TimelineEvent {
  id: number;
  type: AuditActionType;
  timestamp: Date;
  actor: string;
  description: string;
  details?: string;
}

export default function TimelineTab({ patientId, clinicId }: TimelineTabProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [actionFilter, setActionFilter] = useState<AuditActionType | "">("");

  useEffect(() => {
    fetchTimeline();
  }, [page, actionFilter]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({
        entityType: EntityType.CLINIC_PATIENT,
        entityId: patientId,
        actionType: actionFilter || undefined,
        page,
        perPage,
      });

      if (result.success && result.data) {
        const timelineEvents: TimelineEvent[] = result.data.map((log) => {
          const actorName = log.Actor
            ? log.Actor.firstName && log.Actor.lastName
              ? `${log.Actor.firstName} ${log.Actor.lastName}`
              : log.Actor.email
            : "System";

          let description = "";
          let details = "";

          switch (log.actionType) {
            case AuditActionType.CREATE:
              description = "Patient record created";
              break;
            case AuditActionType.UPDATE:
            case AuditActionType.PROFILE_UPDATE:
              description = `Updated ${log.fieldName || "profile"}`;
              if (log.oldValue && log.newValue) {
                details = `Changed from "${log.oldValue}" to "${log.newValue}"`;
              }
              break;
            case AuditActionType.HEALTH_RECORD_UPDATE:
              description = "Updated health records";
              if (log.fieldName) {
                details = `Modified ${log.fieldName}`;
              }
              break;
            case AuditActionType.VIEW:
              description = "Viewed patient record";
              break;
            case AuditActionType.ONBOARDING_START:
              description = "Started onboarding process";
              break;
            case AuditActionType.ONBOARDING_COMPLETE:
              description = "Completed onboarding";
              break;
            case AuditActionType.PERMISSION_GRANT:
              description = "Permission granted";
              if (log.fieldName) {
                details = `Granted: ${log.fieldName}`;
              }
              break;
            case AuditActionType.PERMISSION_REVOKE:
              description = "Permission revoked";
              if (log.fieldName) {
                details = `Revoked: ${log.fieldName}`;
              }
              break;
            default:
              description = log.actionType.replace(/_/g, " ").toLowerCase();
          }

          return {
            id: log.id,
            type: log.actionType,
            timestamp: new Date(log.createdAt),
            actor: actorName,
            description,
            details,
          };
        });

        setEvents(timelineEvents);
        if (result.pagination) {
          setTotal(result.pagination.total);
          setTotalPages(result.pagination.totalPages);
        }
      } else {
        toast.error("Failed to load timeline");
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
      toast.error("Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: AuditActionType) => {
    switch (type) {
      case AuditActionType.CREATE:
        return <UserPlus className="h-4 w-4" />;
      case AuditActionType.UPDATE:
      case AuditActionType.PROFILE_UPDATE:
        return <FileEdit className="h-4 w-4" />;
      case AuditActionType.HEALTH_RECORD_UPDATE:
        return <Stethoscope className="h-4 w-4" />;
      case AuditActionType.ONBOARDING_START:
      case AuditActionType.ONBOARDING_COMPLETE:
        return <Activity className="h-4 w-4" />;
      case AuditActionType.PERMISSION_GRANT:
      case AuditActionType.PERMISSION_REVOKE:
        return <ShieldCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: AuditActionType) => {
    switch (type) {
      case AuditActionType.CREATE:
        return "bg-green-100 text-green-700 border-green-200";
      case AuditActionType.UPDATE:
      case AuditActionType.PROFILE_UPDATE:
        return "bg-blue-100 text-blue-700 border-blue-200";
      case AuditActionType.HEALTH_RECORD_UPDATE:
        return "bg-purple-100 text-purple-700 border-purple-200";
      case AuditActionType.DELETE:
        return "bg-red-100 text-red-700 border-red-200";
      case AuditActionType.ONBOARDING_START:
      case AuditActionType.ONBOARDING_COMPLETE:
        return "bg-amber-100 text-amber-700 border-amber-200";
      case AuditActionType.PERMISSION_GRANT:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case AuditActionType.PERMISSION_REVOKE:
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Timeline
            </CardTitle>
            <CardDescription>
              Chronological view of all patient activities and events
            </CardDescription>
          </div>
          <div className="w-[200px]">
            <Select value={actionFilter || "all"} onValueChange={(value) => setActionFilter(value === "all" ? "" : (value as AuditActionType))}>
              <SelectTrigger>
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                <SelectItem value={AuditActionType.CREATE}>Created</SelectItem>
                <SelectItem value={AuditActionType.UPDATE}>Updated</SelectItem>
                <SelectItem value={AuditActionType.PROFILE_UPDATE}>Profile Updates</SelectItem>
                <SelectItem value={AuditActionType.HEALTH_RECORD_UPDATE}>Health Records</SelectItem>
                <SelectItem value={AuditActionType.ONBOARDING_START}>Onboarding</SelectItem>
                <SelectItem value={AuditActionType.PERMISSION_GRANT}>Permissions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading timeline...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">No events found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Timeline line */}
                  {index < events.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                  )}

                  {/* Event */}
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{event.description}</p>
                          {event.details && (
                            <p className="text-xs text-muted-foreground">{event.details}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{event.actor}</span>
                            <span>•</span>
                            <span>{format(event.timestamp, "MMM d, yyyy 'at' HH:mm")}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0">
                          {event.type.replace(/_/g, " ").toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} events
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
