import type { Metadata } from "next";
import { Suspense } from "react";
import { getAppointmentsAction, getAppointmentCountsAction } from "@/actions/appointments/appointments.action";
import type { AppointmentStatus } from "@public/json/appointment-list";
import { getAppointmentModesAction } from "@/actions/appointments/appointment-mode.action";
import { getAppointmentTypesAction } from "@/actions/appointments/appointment-type.action";
import { getClinicServiceCategoriesAction } from "@/actions/clinics/clinic-service-category.action";
import { getHPsAction } from "@/actions/hp.actions";
import { getSystemsAction } from "@/actions/system.action";
import { AppointmentsClient } from "@/components/v2/appointments/AppointmentsClient";
import { Skeleton } from "@/components/ui/skeleton";
import { getCachedSession } from "@/actions/session.action";
import { getCurrentMemberVisibleTabsAction } from "@/actions/clinics/clinic-member.action";
import { getAppointmentListPreferenceAction } from "@/actions/users/preference.action";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Appointments",
  description: "Manage clinic appointments",
};

interface AppointmentsPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function AppointmentsPage({ params }: AppointmentsPageProps) {
  const { clinicUid } = await params;

  const session = await getCachedSession();

  // Fetch user preference first so the initial appointments query respects it
  const preferenceResult = await getAppointmentListPreferenceAction();
  const preference = preferenceResult.data;

  const [appointmentsResult, countsResult, modes, types, hps, serviceCategories, systems, myHps, visibleTabNames] = await Promise.all([
    getAppointmentsAction({
      clinicUid,
      // Apply persisted status filter
      ...(preference?.statusFilter && preference.statusFilter !== "ALL"
        ? { status: preference.statusFilter as AppointmentStatus }
        : {}),
      // Apply persisted provider filter
      ...(preference?.providerIds?.length ? { hpIds: preference.providerIds } : {}),
      // Apply persisted sort order
      ...(preference?.sortOrder === "schedule" ? { sort: "schedule" as const } : {}),
      // Apply persisted sort direction
      ...(preference?.sortDirection ? { sortDirection: preference.sortDirection } : {}),
    }),
    getAppointmentCountsAction(clinicUid),
    getAppointmentModesAction(clinicUid),
    getAppointmentTypesAction(clinicUid),
    getHPsAction({ clinicUid }),
    getClinicServiceCategoriesAction(clinicUid),
    getSystemsAction(clinicUid),
    // Fetch current user's HPs for accept/decline guard
    session ? getHPsAction({ userId: session.user.sub }) : Promise.resolve([]),
    // Fetch visible appointment tab names for the current user's role
    getCurrentMemberVisibleTabsAction(clinicUid),
  ]);

  const currentUserHpIds = myHps.map((hp) => hp.id);
  const currentUserSub = session?.user?.sub ?? "";

  return (
    <div className="pb-10">
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted-foreground">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <AppointmentsClient
          clinicUid={clinicUid}
          initialAppointments={appointmentsResult.data ?? []}
          counts={countsResult.data ?? {}}
          modes={modes}
          types={types}
          serviceCategories={serviceCategories}
          hps={hps}
          systems={systems}
          currentUserHpIds={currentUserHpIds}
          currentUserSub={currentUserSub}
          visibleTabNames={visibleTabNames}
          initialPreference={preference}
        />
      </Suspense>
    </div>
  );
}
