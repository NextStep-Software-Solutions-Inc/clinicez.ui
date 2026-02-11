import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getAuditLogsAction } from "@actions/audit.action";
import AuditLogTable from "@components/super-admin/AuditLogTable";

export default async function AuditLogsPage() {
  const result = await getAuditLogsAction({
    pageSize: 25,
    page: 1,
  });

  const initialData = result.data ?? {
    logs: [],
    pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Browse all field-level changes across users, patients, organizations, and permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuditLogTable initialData={initialData} />
      </CardContent>
    </Card>
  );
}
