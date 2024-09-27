import React from "react";
import AppointmentPanel  from "../../../../components/appointment/AppointmentPanel";
import { cookies } from "next/headers";
import { Separator } from "@components/ui/separator";
import BookAppointmentSheet from "../../../../components/appointment/BookAppointmentSheet";
import { getAppointmentCountsAction, getRoutedAppointmentCountsAction } from "@actions/appointments/appointments.action";
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import AppointmentDisplay from "../../../../components/appointment/AppointmentDisplay";
import Suspend from "@components/Suspend";
import { Metadata } from "next";
import { getOrgAppointmentTabsAction } from "@actions/organizations/org-appointment-tab..action";

export const maxDuration = 30
export const revalidate = 60
export const metadata: Metadata = {
  title: "Appointments",
  description: "View and respond to appointments",
}

async function AppointmentsPage({ searchParams, params }: AppRouterPageRouteOpts ) {
  const organization = params?.organization as string
  // if(!appointmentStatus || !role ) return redirect(`/${organization}/appointments?_type=pending&_role=admin`)

  const layout = cookies().get("react-resizable-panels:layout")
  const collapsed = cookies().get("react-resizable-panels:collapsed")

  const [appointmentCounts, routedAptCounts, tabs] = await Promise.all([
    getAppointmentCountsAction(organization),
    getRoutedAppointmentCountsAction(organization),
    getOrgAppointmentTabsAction(organization)
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
        <Suspend>
          <AppointmentPanel
            tabs={tabs.data.map(tab => ({
              name: tab.AppointmentTab.name,
              description: tab.AppointmentTab.description,
              roles: tab.OrgRoleAppointmentTabs.map(role => ({
                id: role.Role.id,
                name: role.Role.name
              }))      
            }))}
            appointmentStatusCounts={appointmentCounts.data}
            routedAppointmentStatusCounts={routedAptCounts.data}
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
    const organization = params?.organization
    const newSearchParams = new URLSearchParams(searchParams as Record<string, string>)
    return `/${organization}/appointments?${newSearchParams.toString()}`
  }
});
