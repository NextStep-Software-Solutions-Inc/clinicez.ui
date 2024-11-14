import React from "react";
import AppointmentPanel  from "../../../../../components/appointment/AppointmentPanel";
import { cookies } from "next/headers";
import { Separator } from "@components/ui/separator";
import BookAppointmentSheet from "../../../../../components/appointment/BookAppointmentSheet";
import { getAppointmentCountsAction, getRoutedAppointmentCountsAction } from "@actions/appointments/appointments.action";
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import AppointmentDisplay from "../../../../../components/appointment/AppointmentDisplay";
import Suspend from "@components/Suspend";
import { Metadata } from "next";
import { getClinicAppointmentTabsAction } from "@/actions/clinics/clinic-appointment-tab..action";
import PageLoading from "@components/PageLoading";

export const maxDuration = 30
export const revalidate = 60
export const metadata: Metadata = {
  title: "Appointments",
  description: "View and respond to appointments",
}

async function AppointmentsPage({ searchParams, params }: AppRouterPageRouteOpts ) {
  const clinicUid = String(params?.clinicUid)
  // if(!appointmentStatus || !role ) return redirect(`/${organization}/appointments?_type=pending&_role=admin`)

  const layout = cookies().get("react-resizable-panels:layout")
  const collapsed = cookies().get("react-resizable-panels:collapsed")

  const [appointmentCounts, routedAptCounts, tabs] = await Promise.all([
    getAppointmentCountsAction(clinicUid),
    getRoutedAppointmentCountsAction(clinicUid),
    getClinicAppointmentTabsAction(clinicUid)
  ])
  
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Appointments</h3>
          <p className="text-sm text-muted-foreground">
            View and respond to appointments.
          </p>
        </div>
        <Suspend>
          <BookAppointmentSheet/>
        </Suspend>
      </div>
      <Separator />
      <div className="rounded-[0.5rem] border bg-background shadow">
        <Suspend
          loadingFallback={<PageLoading label="Loading Appointments..."/>}
        >
          <AppointmentPanel
            tabs={tabs.data.map(tab => ({
              name: tab.AppointmentTab.name,
              description: tab.AppointmentTab.description,
              roles: tab.ClinicRoleAppointmentTabs.map(role => ({
                id: role.ClinicMemberRole.id,
                name: role.ClinicMemberRole.name
              }))      
            }))}
            appointmentStatusCounts={appointmentCounts.data ?? {}}
            routedAppointmentStatusCounts={routedAptCounts.data ?? {}}
            defaultLayout={defaultLayout}
            defaultCollapsed={defaultCollapsed}
            navCollapsedSize={4}
          >
            <AppointmentDisplay/>
          </AppointmentPanel>
        </Suspend>
      </div>
    </div>
  );
}


export default withPageAuthRequired(AppointmentsPage, {
  returnTo: ({params, searchParams}) => {
    const organization = String(params?.orgUid)
    const newSearchParams = new URLSearchParams(searchParams as Record<string, string>)
    return `/${organization}/appointments?${newSearchParams.toString()}`
  }
});
