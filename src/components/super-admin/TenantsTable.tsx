"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GetAllTenants, getAllTenantsAction, getTenantOrganizationsAction, getTenantClinicsAction, GetTenantOrganizations, GetTenantClinics } from "@actions/super-admin/tenants.action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Search, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface TenantsTableProps {
  initialData: GetAllTenants;
}

export default function TenantsTable({ initialData }: TenantsTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTenants, setExpandedTenants] = useState<Set<number>>(new Set());
  const [tenantOrganizations, setTenantOrganizations] = useState<Record<number, GetTenantOrganizations>>({});
  const [tenantClinics, setTenantClinics] = useState<Record<number, GetTenantClinics>>({});

  const loadData = async (page = 1, searchTerm = search) => {
    setIsLoading(true);
    try {
      const result = await getAllTenantsAction({
        search: searchTerm || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
      });
      setData(result);
    } catch (error) {
      toast.error("Failed to load tenants");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadData(1, search);
  };

  const toggleTenant = async (tenantId: number) => {
    const newExpanded = new Set(expandedTenants);
    if (newExpanded.has(tenantId)) {
      newExpanded.delete(tenantId);
    } else {
      newExpanded.add(tenantId);
      
      // Load organizations and clinics if not already loaded
      if (!tenantOrganizations[tenantId]) {
        try {
          const [orgs, clinics] = await Promise.all([
            getTenantOrganizationsAction({ tenantId, pageSize: 100, pageNumber: 1 }),
            getTenantClinicsAction({ tenantId, pageSize: 100, pageNumber: 1 }),
          ]);
          setTenantOrganizations({ ...tenantOrganizations, [tenantId]: orgs });
          setTenantClinics({ ...tenantClinics, [tenantId]: clinics });
        } catch (error) {
          toast.error("Failed to load tenant details");
        }
      }
    }
    setExpandedTenants(newExpanded);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-1">
        <Input
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button onClick={handleSearch} size="icon" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Clinics</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No tenants found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((tenant) => (
                <>
                  <TableRow key={tenant.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTenant(tenant.id)}
                        className="h-8 w-8 p-0"
                      >
                        {expandedTenants.has(tenant.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">{tenant.tenantUid}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {tenant.Owner.firstName} {tenant.Owner.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{tenant.Owner.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant._count.Organizations}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant._count.Clinics}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.isActive ? "default" : "secondary"}>
                        {tenant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/super-admin/tenants/${tenant.id}`);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedTenants.has(tenant.id) && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/20">
                        <div className="p-4 space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Organizations ({tenantOrganizations[tenant.id]?.total || 0})</h4>
                            {tenantOrganizations[tenant.id]?.data?.length > 0 ? (
                              <div className="grid gap-2">
                                {tenantOrganizations[tenant.id].data.map((org) => (
                                  <div key={org.id} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                      <div className="font-medium text-sm">{org.name}</div>
                                      <div className="text-xs text-muted-foreground">{org.orgUid}</div>
                                    </div>
                                    <Badge variant="outline">{org._count.OrganizationMembers} members</Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No organizations</p>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Clinics ({tenantClinics[tenant.id]?.total || 0})</h4>
                            {tenantClinics[tenant.id]?.data?.length > 0 ? (
                              <div className="grid gap-2">
                                {tenantClinics[tenant.id].data.map((clinic) => (
                                  <div key={clinic.id} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                      <div className="font-medium text-sm">{clinic.name}</div>
                                      <div className="text-xs text-muted-foreground">{clinic.clinicUid}</div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Badge variant="outline">{clinic._count.ClinicMembers} members</Badge>
                                      <Badge variant="outline">{clinic._count.ClinicPatients} patients</Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No clinics</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.pageNumber - 1) * data.pageSize + 1} to{" "}
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} tenants
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(data.pageNumber - 1)}
              disabled={data.pageNumber === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(data.pageNumber + 1)}
              disabled={data.pageNumber >= data.totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
