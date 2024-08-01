import React from "react";
import AppointmentPanel, { UserRoles }  from "./mail/components/AppointmentPanel";
import { cookies } from "next/headers";
import { Separator } from "@components/ui/separator";
import BookAppointmentSheet from "./components/BookAppointmentSheet";
import { getAppointmentCounts, getAppointmentsAction } from "@actions/appointments/appointments.action";
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { AppointmentStatus } from "@public/json/appointment-list";
import AppointmentDisplay from "./mail/components/AppointmentDisplay";
import Suspend from "@components/Suspend";
import UnderConstruction from "@components/UnderConstruction";

async function AppointmentsPage({ searchParams, params }: AppRouterPageRouteOpts ) {
  const appointmentStatus = searchParams?._type as AppointmentStatus
  const role = searchParams?._role as string
  const organization = params?.organization as string
  // if(!appointmentStatus || !role ) return redirect(`/${organization}/appointments?_type=pending&_role=admin`)

  const appointmentId = parseInt(searchParams?._appointment as string)
  const layout = cookies().get("react-resizable-panels:layout")
  const collapsed = cookies().get("react-resizable-panels:collapsed")

  const appointmentsCounts = await getAppointmentCounts()
  const appointments = await getAppointmentsAction({status: appointmentStatus, orgUid: organization})

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
        <BookAppointmentSheet/>
      </div>
      <Separator />
      <div className="rounded-[0.5rem] border bg-background shadow">
        <Suspend>
          {/* <UnderConstruction/> */}
          <AppointmentPanel
            appointmentsCounts={appointmentsCounts}
            appointments={appointments ?? []}
            defaultLayout={defaultLayout}
            defaultCollapsed={defaultCollapsed}
            navCollapsedSize={4}
          >
            <Suspend>
              <AppointmentDisplay/>
            </Suspend>
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
