import type { Metadata } from "next";
import { getClinicAction } from "@/actions/clinics/clinic.action";
import { getClinicSettingAction } from "@/actions/clinics/clinic-setting.action";
import { getClinicAppointmentConfigAction } from "@/actions/appointments/appointment-config.action";
import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { getClinicRolesAction, getClinicRolesWithPermissionsAction } from "@/actions/clinics/clinic-role.action";
import { getPermissionsAction } from "@/actions/permission.action";
import { getAppointmentModesAction } from "@/actions/appointments/appointment-mode.action";
import { getAppointmentTypesAction } from "@/actions/appointments/appointment-type.action";
import { getClinicServiceCategoriesAction } from "@/actions/clinics/clinic-service-category.action";
import { getClinicAppointmentTabsAction } from "@/actions/clinics/clinic-appointment-tab..action";
import { getAppointmentTabsAction } from "@/actions/appointment-tab.action";
import { checkGoogleCalendarAccess } from "@/actions/google/auth.action";
import { getSystemsAction } from "@/actions/system.action";
import { ClinicSettingsClient } from "@/components/v2/settings/ClinicSettingsClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure clinic settings and preferences",
};

interface ClinicSettingsPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function ClinicSettingsPage({ params }: ClinicSettingsPageProps) {
  const { clinicUid } = await params;

  const [
    clinicResult,
    clinicSettingResult,
    appointmentConfig,
    membersResult,
    roles,
    rolesWithPermissions,
    allClinicPermissions,
    appointmentModes,
    appointmentTypes,
    serviceCategories,
    clinicAppointmentTabsResult,
    allAppointmentTabs,
    googleAccess,
    initialSystems,
  ] = await Promise.all([
    getClinicAction(clinicUid),
    getClinicSettingAction(clinicUid),
    getClinicAppointmentConfigAction(clinicUid),
    getClinicMembersAction({ clinicUid }),
    getClinicRolesAction(),
    getClinicRolesWithPermissionsAction(clinicUid),
    getPermissionsAction({ type: "CLINIC" }),
    getAppointmentModesAction(clinicUid),
    getAppointmentTypesAction(clinicUid),
    getClinicServiceCategoriesAction(clinicUid),
    getClinicAppointmentTabsAction(clinicUid),
    getAppointmentTabsAction(),
    checkGoogleCalendarAccess(),
    getSystemsAction(clinicUid),
  ]);

  if (!clinicResult.status || !clinicResult.data) {
    notFound();
  }

  return (
    <ClinicSettingsClient
      clinicUid={clinicUid}
      clinic={clinicResult.data}
      clinicSetting={clinicSettingResult.data ?? null}
      appointmentConfig={appointmentConfig ?? null}
      members={membersResult.data ?? []}
      roles={roles ?? []}
      rolesWithPermissions={rolesWithPermissions}
      allClinicPermissions={allClinicPermissions}
      appointmentModes={appointmentModes}
      appointmentTypes={appointmentTypes}
      serviceCategories={serviceCategories}
      clinicAppointmentTabs={clinicAppointmentTabsResult.data ?? []}
      allAppointmentTabs={allAppointmentTabs}
      googleCalendarConnected={googleAccess.connected}
      googleCalendarEmail={googleAccess.email}
      initialSystems={initialSystems}
    />
  );
}
