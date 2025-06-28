import {
  Card,
  CardContent, CardDescription, CardHeader,
  CardTitle
} from "@components/ui/card";
import { ClinicMemberStatus } from "@/types";
import { Calendar, CalendarDays, CircleDashed, CircleOff, Pill, UserCheck, UserXIcon } from "lucide-react";
import Link from "next/link";
import Each from "@components/utils/Each";
import dayjs, { combineDateTime } from "@lib/day-utils"
import { getAppointmentsAction } from "@/actions/appointments/appointments.action";
import { getMedicationsAction } from "@/actions/medications/medication.action";

interface ClinicOverviewProps {
  userId: string;
  clinicUid: string;
}

export const ClinicOverview = async ({ userId, clinicUid }: ClinicOverviewProps) => {
  const [ appointments, medications ] = await Promise.all([
    getAppointmentsAction({
      clinicUid,
      userId
    }),
    getMedicationsAction({
      clinicUid,
      patientId: userId,
    })
  ]);


  const totalAppointmentCount = appointments.data?.length ?? 0;
  const upcomingAppointments = appointments.data?.filter(appointment => 
    appointment.AppointmentAttribute?.status === "PENDING" 
    && appointment.AppointmentAttribute.date && dayjs(appointment.AppointmentAttribute.date).isAfter(dayjs(), "minute")
  ) ?? [];
  const totalMedicationCount = medications.data?.length ?? 0;
  const upcomingAppointmentsCount = upcomingAppointments?.length ?? 0;

  return (
    <>
      <div>
        <h3 className="text-lg font-medium mb-2 ml-1">Clinic Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* <Link href={`/clinics/${clinicUid}/membership`}> */}
          <DashboardTile
            title={`Upcoming Appointments`}
            icon={CalendarDays}
            value={`${upcomingAppointmentsCount}`}
            description={`${upcomingAppointmentsCount} Pending applications`}
          />
              
          {/* </Link> */}
          <DashboardTile
            title={`Total Appointments`}
            icon={Calendar}
            value={`${totalAppointmentCount}`}  
            description={`Total count of appointments`}
          />

          <DashboardTile
            title={`Active Medications`}
            icon={Pill}
            value={`${totalMedicationCount}`}
            description={`To be finished on ${new Date().toLocaleDateString()}`}
          />

        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            <Link href={`/clinics/${clinicUid}/appointments`} legacyBehavior>
              <span className="text-primary">View all</span>
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Each 
            of={upcomingAppointments}
            fallback={<div className="text-center text-muted-foreground">No upcoming appointments</div>}
            render={appointment => (
              <div key={appointment.id} className="flex items-center justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CircleDashed className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{appointment.subject}</p>
                    {
                      appointment.AppointmentAttribute?.date && 
                      appointment.AppointmentAttribute?.timeStart &&
                    <p className="text-sm text-muted-foreground">{dayjs(combineDateTime(appointment.AppointmentAttribute?.date, appointment.AppointmentAttribute?.timeStart)).format("lll")}</p>}
                    <p className="text-xs text-muted-foreground lowercase">{appointment.AppointmentAttribute?.status}</p>
                  </div>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </>
  );
};

interface DashboardTileProps {
  title: string;
  icon: React.ElementType;
  value: string;
  description: string;

}
export const DashboardTile = ({title, icon: Icon, value, description}: DashboardTileProps) => {
  return (
    <Card className="group/icon hover:ring-1">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">{title}</CardTitle>
        <Icon className="text-primary group-hover/icon:scale-150 transition-all" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}