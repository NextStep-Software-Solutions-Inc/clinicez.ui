import React from "react";
import AppointmentPanel from "@components/appointment/AppointmentPanel";
import { cookies } from "next/headers";
import { Separator } from "@components/ui/separator";
import { getAppointmentCountsAction, getRoutedAppointmentCountsAction, getTaggedAppointmentCountsAction } from "@actions/appointments/appointments.action";
import AppointmentDisplay from "@components/appointment/AppointmentDisplay";
import Suspend from "@components/Suspend";
import { Metadata } from "next";
import { getClinicAppointmentTabsAction } from "@/actions/clinics/clinic-appointment-tab..action";
import PageLoading from "@components/PageLoading";
import { Button } from "@/components/ui/button";
import BookAppointmentBtn from "@/components/BookAppointmentBtn";
import { getCachedSession } from "@/actions/session.action";
import { redirect } from "next/navigation";
import { AppRouterPageRouteOpts } from "@/types";

export const maxDuration = 20
export const revalidate = 60
export const metadata: Metadata = {
  title: "Appointments",
  description: "View and respond to appointments",
}

interface AppointmentsPageProps {
  params: Promise<{ clinicUid: string }>
}

export default async function AppointmentsPage(props: AppointmentsPageProps) {
  const params = await props.params;
  const clinicUid = String(params?.clinicUid)
  const session = await getCachedSession()
  // if(!appointmentStatus || !role ) return redirect(`/${organization}/appointments?_type=pending&_role=admin`)

  const layout = (await cookies()).get("react-resizable-panels:layout")
  const collapsed = (await cookies()).get("react-resizable-panels:collapsed")

  const [appointmentCounts, routedAptCounts, taggedAptCounts, tabs] = await Promise.all([
    getAppointmentCountsAction(clinicUid),
    getRoutedAppointmentCountsAction(clinicUid),
    getTaggedAppointmentCountsAction(clinicUid),
    getClinicAppointmentTabsAction(clinicUid)
  ])

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined

  if (!session) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/clinics/${clinicUid}/appointments`)}`)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Appointments</h3>
          <p className="text-sm text-muted-foreground">
            View and respond to appointments.
          </p>
        </div>
        <BookAppointmentBtn
          clinicUid={clinicUid}
          userId={session.user.sub}
        >
          <Button>Book Appointment</Button>
        </BookAppointmentBtn>
      </div>
      <Separator />
      <div className="rounded-[0.5rem] border bg-background shadow">
        <Suspend
          loadingFallback={<PageLoading label="Loading Appointments..." />}
        >
          <AppointmentPanel
            tabs={tabs.data.map(tab => ({
              name: tab.AppointmentTab.name,
              description: tab.AppointmentTab.description,
              roles: tab.ClinicRoleAppointmentTabs.map(role => ({
                id: role.ClinicRole.id,
                name: role.ClinicRole.name
              }))
            }))}
            appointmentStatusCounts={appointmentCounts.data ?? {}}
            routedAppointmentStatusCounts={routedAptCounts.data ?? {}}
            taggedAppointmentStatusCounts={taggedAptCounts.data ?? {}}
            defaultLayout={defaultLayout}
            defaultCollapsed={defaultCollapsed}
            navCollapsedSize={4}
          >
            <AppointmentDisplay />
          </AppointmentPanel>
        </Suspend>
      </div>
    </div>
  );
}