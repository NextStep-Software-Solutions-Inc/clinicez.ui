import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getAllRolesAction } from "@actions/super-admin/roles.action";
import RolesTable from "@components/super-admin/RolesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";

export default async function RolesPage() {
  const [clinicRoles, orgRoles] = await Promise.all([
    getAllRolesAction({ pageSize: 10, pageNumber: 1, type: "CLINIC" }),
    getAllRolesAction({ pageSize: 10, pageNumber: 1, type: "ORGANIZATION" }),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles</CardTitle>
        <CardDescription>
          Manage clinic and organization roles that can be assigned to members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="clinic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clinic">Clinic Roles</TabsTrigger>
            <TabsTrigger value="organization">Organization Roles</TabsTrigger>
          </TabsList>
          <TabsContent value="clinic" className="mt-4">
            <RolesTable initialData={clinicRoles} type="CLINIC" />
          </TabsContent>
          <TabsContent value="organization" className="mt-4">
            <RolesTable initialData={orgRoles} type="ORGANIZATION" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
