"use client";

import { useState } from "react";
import { GetAuditLogs, getAuditLogsAction, GetAuditLogsPayload } from "@actions/audit.action";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { formatDistance } from "date-fns";

type AuditLogData = NonNullable<GetAuditLogs["data"]>;

interface AuditLogTableProps {
  initialData: AuditLogData;
}

const ENTITY_TYPES = [
  "USER",
  "PATIENT",
  "ORGANIZATION",
  "CLINIC",
  "PERMISSION",
  "CLINIC_MEMBER",
  "ORG_MEMBER",
  "PROVIDER",
  "ONBOARDING",
] as const;

const ACTION_TYPES = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "PERMISSION_GRANT",
  "PERMISSION_REVOKE",
  "STATUS_CHANGE",
  "ONBOARDING",
  "JOIN",
  "LEAVE",
  "CLAIM",
] as const;

export default function AuditLogTable({ initialData }: AuditLogTableProps) {
  const [data, setData] = useState(initialData);
  const [fieldName, setFieldName] = useState("");
  const [entityType, setEntityType] = useState<string>("");
  const [actionType, setActionType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async (page = 1) => {
    setIsLoading(true);
    try {
      const payload: GetAuditLogsPayload = {
        page,
        pageSize: data.pagination.pageSize,
      };
      if (fieldName) payload.fieldName = fieldName;
      if (entityType) payload.entityType = entityType as GetAuditLogsPayload["entityType"];
      if (actionType) payload.action = actionType as GetAuditLogsPayload["action"];

      const result = await getAuditLogsAction(payload);
      if (result.status && result.data) {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to load audit logs");
      }
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadData(1);
  };

  const handleReset = () => {
    setFieldName("");
    setEntityType("");
    setActionType("");
  };

  const { logs, pagination } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionType} onValueChange={setActionType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((action) => (
              <SelectItem key={action} value={action}>
                {action.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search by field name..."
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-[200px]"
        />

        <Button onClick={handleSearch} size="icon" variant="outline" disabled={isLoading}>
          <Search className="h-4 w-4" />
        </Button>

        <Button onClick={handleReset} variant="ghost" size="sm">
          Reset
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Previous Value</TableHead>
              <TableHead>New Value</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <Badge variant="outline">{log.entityType.replace(/_/g, " ")}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">ID: {log.entityId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.action === "DELETE" ? "destructive" : "secondary"}>
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.fieldName ?? "—"}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">
                    {log.previousValue ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">
                    {log.newValue ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.Performer
                      ? `${log.Performer.firstName ?? ""} ${log.Performer.lastName ?? ""}`.trim() ||
                        log.Performer.email
                      : "System"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistance(new Date(log.performedAt), new Date(), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total} logs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
