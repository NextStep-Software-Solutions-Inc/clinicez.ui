import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getAllPermissionsAction } from "@actions/super-admin/permissions.action";
import PermissionsTable from "@components/super-admin/PermissionsTable";

export default async function PermissionsPage() {
  const initialData = await getAllPermissionsAction({
    pageSize: 10,
    pageNumber: 1,
    includeInactive: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>
          Manage system permissions that can be assigned to users, roles, and members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PermissionsTable initialData={initialData} />
      </CardContent>
    </Card>
  );
}
