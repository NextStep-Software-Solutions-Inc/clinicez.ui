import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getAllUsersAction } from "@actions/super-admin/users.action";
import UsersTable from "@components/super-admin/UsersTable";

export default async function UsersPage() {
  const initialData = await getAllUsersAction({
    pageSize: 10,
    pageNumber: 1,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Manage all users in the system and view their memberships.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UsersTable initialData={initialData} />
      </CardContent>
    </Card>
  );
}
