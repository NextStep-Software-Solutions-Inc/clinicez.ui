import type { Metadata } from "next";
import { Suspense } from "react";
import { getAppointmentsAction, getAppointmentCountsAction } from "@/actions/appointments/appointments.action";
import { getAppointmentModesAction } from "@/actions/appointments/appointment-mode.action";
import { getAppointmentTypesAction } from "@/actions/appointments/appointment-type.action";
import { getClinicServicesAction } from "@/actions/clinics/clinic-service.action";
import { getHPsAction } from "@/actions/hp.actions";
import { AppointmentsClient } from "@/components/v2/appointments/AppointmentsClient";
import { Skeleton } from "@/components/ui/skeleton";
import { getCachedSession } from "@/actions/session.action";
import { getCurrentMemberVisibleTabsAction } from "@/actions/clinics/clinic-member.action";

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

  const [appointmentsResult, countsResult, modes, types, hps, services, myHps, visibleTabNames] = await Promise.all([
    getAppointmentsAction({ clinicUid }),
    getAppointmentCountsAction(clinicUid),
    getAppointmentModesAction(clinicUid),
    getAppointmentTypesAction(clinicUid),
    getHPsAction({ clinicUid }),
    getClinicServicesAction({ clinicUid }),
    // Fetch current user's HPs for accept/decline guard
    session ? getHPsAction({ userId: session.user.sub }) : Promise.resolve([]),
    // Fetch visible appointment tab names for the current user's role
    getCurrentMemberVisibleTabsAction(clinicUid),
  ]);

  const currentUserHpIds = myHps.map((hp) => hp.id);

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
          services={services}
          hps={hps}
          currentUserHpIds={currentUserHpIds}
          visibleTabNames={visibleTabNames}
        />
      </Suspense>
    </div>
  );
}
