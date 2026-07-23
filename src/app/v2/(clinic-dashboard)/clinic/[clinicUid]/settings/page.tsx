import type { Metadata } from "next";
import { Suspense } from "react";
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
import { checkGoogleCalendarAccess, getCalendarEvents } from "@/actions/google/auth.action";
import { getSystemsAction } from "@/actions/system.action";
import { ClinicSettingsClient } from "@/components/v2/settings/ClinicSettingsClient";
import { notFound } from "next/navigation";
import { getCachedSession } from "@/actions/session.action";
import { PERMISSIONS } from "@/lib/permissions";

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

  const session = await getCachedSession();

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
    myPermissions,
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
    session ? getPermissionsAction({ userId: session.user.sub, type: "CLINIC" }) : Promise.resolve([]),
  ]);

  if (!clinicResult.status || !clinicResult.data) {
    notFound();
  }

  const myPermissionSet = new Set(myPermissions.map(p => p.name));
  const canUpdateSettings = myPermissionSet.has(PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name);

  const googleCalendarEvents = googleAccess.connected
    ? await getCalendarEvents(20).catch(() => [])
    : [];

  return (
    <Suspense>
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
        googleCalendarEvents={googleCalendarEvents}
        initialSystems={initialSystems}
        canUpdateSettings={canUpdateSettings}
      />
    </Suspense>
  );
}
