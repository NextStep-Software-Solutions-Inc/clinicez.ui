import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getOrganizationByIdAction, getOrganizationRolesAction } from "@actions/super-admin/organizations.action";
import { notFound } from "next/navigation";
import { Badge } from "@components/ui/badge";
import { Building2, Users } from "lucide-react";
import OrganizationRolesTable from "@components/super-admin/OrganizationRolesTable";
import Link from "next/link";

interface OrganizationDetailPageProps {
  params: {
    orgId: string;
  };
}

export default async function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  const orgId = parseInt(params.orgId);
  
  if (isNaN(orgId)) {
    notFound();
  }

  const [organization, initialRoles] = await Promise.all([
    getOrganizationByIdAction({ orgId }),
    getOrganizationRolesAction({ orgId, pageSize: 10, pageNumber: 1 }),
  ]);
  
  if (!organization) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/super-admin/tenants" className="hover:underline">
            Tenants
          </Link>
          <span>/</span>
          <Link href={`/super-admin/tenants/${organization.Tenant.id}`} className="hover:underline">
            {organization.Tenant.name}
          </Link>
          <span>/</span>
          <span>Organization</span>
        </div>
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <p className="text-muted-foreground">{organization.description || "No description"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{organization._count.OrganizationMembers}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total organization members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{organization._count.OrganizationRoles}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Configured roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="text-muted-foreground">UID</div>
              <div className="font-medium">{organization.orgUid}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Organization Roles</CardTitle>
          <CardDescription>
            Manage roles that can be assigned to members within this organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationRolesTable initialData={initialRoles} orgId={orgId} />
        </CardContent>
      </Card>
    </div>
  );
}
