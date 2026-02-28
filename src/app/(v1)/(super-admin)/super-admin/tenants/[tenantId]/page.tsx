import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getTenantByIdAction } from "@actions/super-admin/tenants.action";
import { notFound } from "next/navigation";
import TenantDetailTabs from "@components/super-admin/TenantDetailTabs";

interface TenantDetailPageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const { tenantId: tenantIdString } = await params;
  const tenantId = parseInt(tenantIdString);
  
  if (isNaN(tenantId)) {
    notFound();
  }

  const tenant = await getTenantByIdAction({ tenantId });
  
  if (!tenant) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{tenant.name}</h1>
        <p className="text-muted-foreground">{tenant.description || "No description"}</p>
      </div>
      
      <TenantDetailTabs tenant={tenant} />
    </div>
  );
}
