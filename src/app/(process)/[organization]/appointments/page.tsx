import React from "react";
import AppointmentPanel  from "./mail/components/AppointmentPanel";
import { accounts } from "./mail/data"
import { cookies } from "next/headers";
import { Separator } from "@components/ui/separator";
import BookAppointment from "./components/BookAppointment";
import { getAppointments } from "@actions/appointments.action";
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { AppointmentStatus } from "@public/json/appointment-list";
import AppointmentDisplay from "./mail/components/AppointmentDisplay";
import { redirect } from "next/navigation"
import Suspend from "@components/Suspend";

async function AppointmentsPage({ searchParams, params }: AppRouterPageRouteOpts ) {
  console.log(searchParams?._type);
  
  const appointmentStatus = searchParams?._type as AppointmentStatus
  const organization = params?.organization as string
  if(!appointmentStatus) return redirect(`/${organization}/appointments?_type=pending`)

  const appointmentId = searchParams?._appointment as string
  const layout = cookies().get("react-resizable-panels:layout")
  const collapsed = cookies().get("react-resizable-panels:collapsed")

  const appointments = await getAppointments(appointmentStatus)

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
        <BookAppointment/>
      </div>
      <Separator />
      <div className="rounded-[0.5rem] border bg-background shadow]">
        <Suspend>
          <AppointmentPanel
            accounts={accounts}
            appointments={appointments}
            defaultLayout={defaultLayout}
            defaultCollapsed={defaultCollapsed}
            navCollapsedSize={4}
          >
            <AppointmentDisplay appointmentId={appointmentId || null}/>
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