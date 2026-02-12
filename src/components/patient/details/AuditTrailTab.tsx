"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSearch, Download, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { getAuditLogs, exportAuditLogs } from "@/actions/audit.action";
import { EntityType, AuditActionType } from "@prisma/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface AuditTrailTabProps {
  patientId: number;
  clinicId: number;
  canExport: boolean;
}

interface AuditLog {
  id: number;
  actionType: AuditActionType;
  entityType: EntityType;
  entityId: number | null;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  Actor: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export default function AuditTrailTab({ patientId, clinicId, canExport }: AuditTrailTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [actionTypeFilter, setActionTypeFilter] = useState<AuditActionType | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [page, actionTypeFilter, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({
        entityType: EntityType.CLINIC_PATIENT,
        entityId: patientId,
        actionType: actionTypeFilter || undefined,
        page,
        perPage,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      if (result.success && result.data) {
        setLogs(result.data as AuditLog[]);
        if (result.pagination) {
          setTotal(result.pagination.total);
          setTotalPages(result.pagination.totalPages);
        }
      } else {
        toast.error("Failed to load audit logs");
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error("You don't have permission to export audit logs");
      return;
    }

    setExporting(true);
    try {
      const result = await exportAuditLogs({
        entityType: EntityType.CLINIC_PATIENT,
        entityId: patientId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `patient-${patientId}-audit-trail-${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Audit trail exported successfully");
      } else {
        toast.error("Failed to export audit trail");
      }
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      toast.error("Failed to export audit trail");
    } finally {
      setExporting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.fieldName?.toLowerCase().includes(searchLower) ||
      log.oldValue?.toLowerCase().includes(searchLower) ||
      log.newValue?.toLowerCase().includes(searchLower) ||
      log.Actor?.firstName?.toLowerCase().includes(searchLower) ||
      log.Actor?.lastName?.toLowerCase().includes(searchLower) ||
      log.Actor?.email.toLowerCase().includes(searchLower)
    );
  });

  const getActorName = (actor: AuditLog["Actor"]) => {
    if (!actor) return "System";
    if (actor.firstName && actor.lastName) {
      return `${actor.firstName} ${actor.lastName}`;
    }
    return actor.email;
  };

  const getActionLabel = (actionType: AuditActionType) => {
    return actionType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Complete history of all changes and actions on this patient record
            </CardDescription>
          </div>
          {canExport && (
            <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Filters</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search field, value, actor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-type" className="text-xs">Action Type</Label>
              <Select value={actionTypeFilter} onValueChange={(value) => setActionTypeFilter(value as AuditActionType | "")}>
                <SelectTrigger id="action-type">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value={AuditActionType.CREATE}>Create</SelectItem>
                  <SelectItem value={AuditActionType.UPDATE}>Update</SelectItem>
                  <SelectItem value={AuditActionType.DELETE}>Delete</SelectItem>
                  <SelectItem value={AuditActionType.VIEW}>View</SelectItem>
                  <SelectItem value={AuditActionType.PROFILE_UPDATE}>Profile Update</SelectItem>
                  <SelectItem value={AuditActionType.HEALTH_RECORD_UPDATE}>Health Record Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-xs">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-xs">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {(actionTypeFilter || startDate || endDate || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionTypeFilter("");
                setStartDate("");
                setEndDate("");
                setSearchTerm("");
                setPage(1);
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">No audit logs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Timestamp</TableHead>
                    <TableHead className="w-[180px]">Actor</TableHead>
                    <TableHead className="w-[120px]">Action</TableHead>
                    <TableHead className="w-[120px]">Field</TableHead>
                    <TableHead>Old Value</TableHead>
                    <TableHead>New Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {getActorName(log.Actor)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {getActionLabel(log.actionType)}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {log.fieldName || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.oldValue || "-"}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {log.newValue || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} entries
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
