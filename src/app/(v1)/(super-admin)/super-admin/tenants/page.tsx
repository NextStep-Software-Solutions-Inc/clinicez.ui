import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getAllTenantsAction } from "@actions/super-admin/tenants.action";
import TenantsTable from "@components/super-admin/TenantsTable";

export default async function TenantsPage() {
  const initialData = await getAllTenantsAction({
    pageSize: 10,
    pageNumber: 1,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenants</CardTitle>
        <CardDescription>
          Manage all tenants in the system. Click on a tenant to view organizations and clinics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TenantsTable initialData={initialData} />
      </CardContent>
    </Card>
  );
}
