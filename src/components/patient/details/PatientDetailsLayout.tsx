"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { User, FileText, Clock, Stethoscope, Shield, FileSearch } from "lucide-react";
import ProfileTab from "./ProfileTab";
import HealthRecordsTab from "./HealthRecordsTab";
import TimelineTab from "./TimelineTab";
import ConsultationsTab from "./ConsultationsTab";
import PermissionsTab from "./PermissionsTab";
import AuditTrailTab from "./AuditTrailTab";

interface PatientDetailsLayoutProps {
  patientId: number;
  clinicId: number;
  clinicUid: string;
  userId: number;
  patientData: {
    id: number;
    onboardingStatus: string | null;
    addedBy: number | null;
    Patient: {
      id: number;
      firstName: string | null;
      middleName: string | null;
      lastName: string | null;
      suffix: string | null;
      nickname: string | null;
      email: string | null;
      mobile: string | null;
      telephone: string | null;
      dob: Date | null;
      gender: string | null;
      placeOfBirth: string | null;
      civilStatus: string | null;
      bloodType: string | null;
      religion: string | null;
      nationality: string | null;
      onboardingStatus: string | null;
      isShellAccount: boolean | null;
      shellAccountCreatedBy: number | null;
      profileCompletionDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    Clinic: {
      id: number;
      name: string;
    };
  };
  permissions: {
    canViewProfile: boolean;
    canEditProfile: boolean;
    canViewHealthRecords: boolean;
    canEditHealthRecords: boolean;
    canAddHealthRecords: boolean;
    canViewConsultations: boolean;
    canViewAuditLog: boolean;
    canExportAuditLog: boolean;
    canGenerateReport: boolean;
  };
}

export default function PatientDetailsLayout({
  patientId,
  clinicId,
  clinicUid,
  userId,
  patientData,
  permissions,
}: PatientDetailsLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") || "profile";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2" disabled={!permissions.canViewHealthRecords}>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Health Records</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="consultations" className="flex items-center gap-2" disabled={!permissions.canViewConsultations}>
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">Consultations</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2" disabled={!permissions.canViewAuditLog}>
            <FileSearch className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Trail</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab
            patientId={patientId}
            clinicId={clinicId}
            userId={userId}
            patientData={patientData}
            canEdit={permissions.canEditProfile}
          />
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <HealthRecordsTab
            patientId={patientId}
            clinicId={clinicId}
            userId={userId}
            patientData={patientData}
            canEdit={permissions.canEditHealthRecords}
            canAdd={permissions.canAddHealthRecords}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <TimelineTab patientId={patientId} clinicId={clinicId} />
        </TabsContent>

        <TabsContent value="consultations" className="mt-6">
          <ConsultationsTab patientId={patientId} clinicId={clinicId} clinicUid={clinicUid} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <PermissionsTab permissions={permissions} />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditTrailTab
            patientId={patientId}
            clinicId={clinicId}
            canExport={permissions.canExportAuditLog}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
