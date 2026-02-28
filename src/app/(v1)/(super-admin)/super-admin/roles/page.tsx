import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getAllRolesAction } from "@actions/super-admin/roles.action";
import RolesTable from "@components/super-admin/RolesTable";

export default async function RolesPage() {
  const clinicRoles = await getAllRolesAction({ pageSize: 10, pageNumber: 1, type: "CLINIC" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinic Roles</CardTitle>
        <CardDescription>
          Manage global clinic roles that can be assigned to clinic members across all tenants.
          Organization roles are managed within each organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RolesTable initialData={clinicRoles} type="CLINIC" />
      </CardContent>
    </Card>
  );
}
