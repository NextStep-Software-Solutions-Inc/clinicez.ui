import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getAllSystemAdminsAction } from "@actions/super-admin/system-admins.action";
import SystemAdminsTable from "@components/super-admin/SystemAdminsTable";

export default async function SystemAdminsPage() {
  const initialData = await getAllSystemAdminsAction({
    pageSize: 10,
    pageNumber: 1,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Admins</CardTitle>
        <CardDescription>
          Manage system administrators who can help manage the platform. System admins have elevated privileges to assist with system-wide management tasks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SystemAdminsTable initialData={initialData} />
      </CardContent>
    </Card>
  );
}
