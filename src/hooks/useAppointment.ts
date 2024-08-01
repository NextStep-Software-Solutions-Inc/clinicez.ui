import { GetAppointment, GetAppointments } from "@actions/appointments/appointments.action"
import { AppointmentStatus } from "@public/json/appointment-list"
import { self } from "@services/request"
import useSWR from "swr"

type UseOrgAppointmentsFilter = {
    orgId: string,
    status?: string | null
}
export const useOrgAppointments = (filter: UseOrgAppointmentsFilter) => {
  const { orgId, status } = filter
  const fetcher = (...args: any) => self.get<GetAppointments>(args)
  const searchParams = new URLSearchParams()
  if(status) searchParams.set('status', status)
  return useSWR(`/api/organizations/${orgId}/appointments?${searchParams.toString()}`, fetcher)
}


type UseOrgAppointment = {
    orgId: string,
    appointmentId: number
}
export const useOrgAppointment = ({orgId, appointmentId}:UseOrgAppointment) => {
  const fetcher = (...args: any) => self.get<GetAppointment>(args)
  return useSWR(`/api/organizations/${orgId}/appointments/${appointmentId}`, fetcher)
}