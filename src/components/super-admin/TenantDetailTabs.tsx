"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getTenantOrganizationsAction, getTenantClinicsAction, GetTenantOrganizations, GetTenantClinics } from "@actions/super-admin/tenants.action";
import { Badge } from "@components/ui/badge";
import { Building2, Hospital, Users, ExternalLink } from "lucide-react";
import { Button } from "@components/ui/button";
import { TenantAILimitManager } from "@/components/super-admin/TenantAILimitManager";

interface TenantDetailTabsProps {
  tenant: {
    id: number;
    tenantUid: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    Owner: {
      id: number;
      userId: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
    _count: {
      Organizations: number;
      Clinics: number;
    };
  };
}

type OrganizationData = GetTenantOrganizations["data"][number];
type ClinicData = GetTenantClinics["data"][number];

export default function TenantDetailTabs({ tenant }: TenantDetailTabsProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [clinics, setClinics] = useState<ClinicData[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(false);

  const loadOrganizations = async () => {
    if (organizations.length > 0) return;
    
    setLoadingOrgs(true);
    try {
      const result = await getTenantOrganizationsAction({
        tenantId: tenant.id,
        pageSize: 100,
        pageNumber: 1,
      });
      setOrganizations(result.data);
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const loadClinics = async () => {
    if (clinics.length > 0) return;
    
    setLoadingClinics(true);
    try {
      const result = await getTenantClinicsAction({
        tenantId: tenant.id,
        pageSize: 100,
        pageNumber: 1,
      });
      setClinics(result.data);
    } catch (error) {
      console.error("Failed to load clinics:", error);
    } finally {
      setLoadingClinics(false);
    }
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organizations" onClick={loadOrganizations}>
            Organizations
          </TabsTrigger>
          <TabsTrigger value="clinics" onClick={loadClinics}>
            Clinics
          </TabsTrigger>
          <TabsTrigger value="ai-limits">
            AI Limits
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tenant._count.Organizations}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Total organizations in this tenant
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hospital className="h-5 w-5" />
                Clinics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tenant._count.Clinics}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Total clinics in this tenant
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="text-sm text-muted-foreground">Tenant UID:</div>
              <div className="text-sm font-medium break-all">{tenant.tenantUid}</div>
              
              <div className="text-sm text-muted-foreground">Owner:</div>
              <div className="text-sm font-medium">
                {tenant.Owner.firstName} {tenant.Owner.lastName}
              </div>
              
              <div className="text-sm text-muted-foreground">Owner Email:</div>
              <div className="text-sm font-medium">{tenant.Owner.email}</div>
              
              <div className="text-sm text-muted-foreground">Status:</div>
              <div>
                <Badge variant={tenant.isActive ? "default" : "secondary"}>
                  {tenant.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="organizations" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>
              View organization setup and manage roles within each organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrgs ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading organizations...
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No organizations found in this tenant
              </div>
            ) : (
              <div className="space-y-4">
                {organizations.map((org) => (
                  <Card key={org.id}>
                    <CardHeader>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                          <CardDescription className="break-all">{org.orgUid}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {org._count.OrganizationMembers} members
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/super-admin/organizations/${org.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {org.description || "No description"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="clinics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Clinics</CardTitle>
            <CardDescription>
              View clinic setup and manage appointment tab configurations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingClinics ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading clinics...
              </div>
            ) : clinics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No clinics found in this tenant
              </div>
            ) : (
              <div className="space-y-4">
                {clinics.map((clinic) => (
                  <Card key={clinic.id}>
                    <CardHeader>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg">{clinic.name}</CardTitle>
                          <CardDescription className="break-all">{clinic.clinicUid}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {clinic._count.ClinicMembers} members
                          </Badge>
                          <Badge variant="outline">
                            {clinic._count.ClinicPatients} patients
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/super-admin/clinics/${clinic.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {clinic.description || "No description"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ai-limits" className="space-y-4">
        <TenantAILimitManager tenantId={tenant.id} tenantName={tenant.name} />
      </TabsContent>
    </Tabs>
  );
}
