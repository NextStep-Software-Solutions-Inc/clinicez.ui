import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getAllTenantsAction } from "@actions/super-admin/tenants.action";
import TenantsTable from "@components/super-admin/TenantsTable";
import { Button } from "@components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function TenantsPage() {
  const initialData = await getAllTenantsAction({
    pageSize: 10,
    pageNumber: 1,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            Manage all tenants in the system. Click on a tenant to view organizations and clinics.
          </CardDescription>
        </div>
        <Link href="/super-admin/setup-wizard">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Setup Wizard
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <TenantsTable initialData={initialData} />
      </CardContent>
    </Card>
  );
}
