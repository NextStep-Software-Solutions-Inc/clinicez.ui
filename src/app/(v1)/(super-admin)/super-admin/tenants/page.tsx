import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getAllTenantsAction } from "@actions/super-admin/tenants.action";
import TenantsTable from "@components/super-admin/TenantsTable";
import { Button } from "@components/ui/button";
import Link from "next/link";
import { Wand2 } from "lucide-react";
import { CreateTenantDialog } from "@components/super-admin/CreateTenantDialog";

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
        <div className="flex items-center gap-2">
          <CreateTenantDialog />
          <Link href="/super-admin/setup-wizard">
            <Button variant="outline">
              <Wand2 className="w-4 h-4 mr-2" />
              Setup Wizard
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <TenantsTable initialData={initialData} />
      </CardContent>
    </Card>
  );
}
