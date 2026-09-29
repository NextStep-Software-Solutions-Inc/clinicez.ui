import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getClinicByIdAction, getClinicRolesAction, getAllClinicRolesAction, getClinicAppointmentTabsAction, getClinicMembersForAdminAction, getClinicPatientsForAdminAction } from "@actions/super-admin/clinics.action";
import { notFound } from "next/navigation";
import { Badge } from "@components/ui/badge";
import { Hospital, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import ClinicRolesTable from "@components/super-admin/ClinicRolesTable";
import ClinicMembersTable from "@components/super-admin/ClinicMembersTable";
import ClinicPatientsTable from "@components/super-admin/ClinicPatientsTable";
import ClinicAppointmentTabsManager from "@components/super-admin/ClinicAppointmentTabsManager";
import { ClinicProceduresManager } from "@components/super-admin/ClinicProceduresManager";
import DocumentTemplateTypeManager from "@components/super-admin/DocumentTemplateTypeManager";
import DocumentTemplates from "@components/DocumentTemplates";
import { ClinicAILimitManager } from "@/components/super-admin/ClinicAILimitManager";

interface ClinicDetailPageProps {
  params: Promise<{
    clinicId: string;
  }>;
}

export default async function ClinicDetailPage({ params }: ClinicDetailPageProps) {
  const { clinicId: clinicIdString } = await params;
  const clinicId = parseInt(clinicIdString);
  
  if (isNaN(clinicId)) {
    notFound();
  }

  const [clinic, initialRoles, allRoles, appointmentTabsData, initialMembers, initialPatients] = await Promise.all([
    getClinicByIdAction({ clinicId }),
    getClinicRolesAction({ pageSize: 10, pageNumber: 1 }),
    getAllClinicRolesAction(),
    getClinicAppointmentTabsAction({ clinicId }),
    getClinicMembersForAdminAction({ clinicId }),
    getClinicPatientsForAdminAction({ clinicId }),
  ]);
  
  if (!clinic) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
          <Link href="/super-admin/tenants" className="hover:underline">
            Tenants
          </Link>
          <span>/</span>
          <Link href={`/super-admin/tenants/${clinic.Tenant.id}`} className="hover:underline">
            {clinic.Tenant.name}
          </Link>
          <span>/</span>
          <span>Clinic</span>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{clinic.name}</h1>
        <p className="text-muted-foreground">{clinic.description || "No description"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clinic._count.ClinicMembers}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total clinic members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clinic._count.ClinicPatients}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total clinic patients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Tabs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clinic._count.ClinicAppointmentTabs}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Configured tabs
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clinic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="text-sm text-muted-foreground">Clinic UID:</div>
            <div className="text-sm font-medium break-all">{clinic.clinicUid}</div>
            
            {clinic.email && (
              <>
                <div className="text-sm text-muted-foreground">Email:</div>
                <div className="text-sm font-medium">{clinic.email}</div>
              </>
            )}
            
            <div className="text-sm text-muted-foreground">Status:</div>
            <div>
              <Badge variant={clinic.isActive ? "default" : "secondary"}>
                {clinic.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="roles" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="roles">Clinic Roles</TabsTrigger>
            <TabsTrigger value="members">
              Members
              <Badge variant="secondary" className="ml-1 text-xs hidden sm:inline-flex">
                {clinic._count.ClinicMembers}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="patients">
              Patients
              <Badge variant="secondary" className="ml-1 text-xs hidden sm:inline-flex">
                {clinic._count.ClinicPatients}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="appointment-tabs">Appt Tabs</TabsTrigger>
            <TabsTrigger value="procedures">Procedures</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="ai-limits">AI Limits</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Roles (System-wide)</CardTitle>
              <CardDescription>
                Global clinic roles used across all clinics in the system. Member counts shown are system-wide totals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicRolesTable initialData={initialRoles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinic User Management</CardTitle>
              <CardDescription>
                Manage individual member permissions within this clinic. Each member has a role with default permissions, but you can customize their permissions here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicMembersTable initialData={initialMembers} clinicId={clinicId} availableRoles={allRoles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Patient Management</CardTitle>
              <CardDescription>
                Manage individual patient permissions within this clinic. Patients have clinic-level permissions that control what they can access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicPatientsTable initialData={initialPatients} clinicId={clinicId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointment-tabs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Tabs Configuration</CardTitle>
              <CardDescription>
                Configure which appointment tabs are available for this clinic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicAppointmentTabsManager
                clinicId={clinicId}
                initialData={appointmentTabsData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procedures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Procedures</CardTitle>
              <CardDescription>
                Configure diagnostic and procedures available for this clinic. You can create clinic-specific procedures or link them to master procedures.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicProceduresManager clinicId={clinicId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <DocumentTemplateTypeManager />
            <DocumentTemplates clinicUid={clinic.clinicUid} label="Clinic" />
          </div>
        </TabsContent>

        <TabsContent value="ai-limits" className="space-y-4">
          <ClinicAILimitManager clinicId={clinicId} clinicName={clinic.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
