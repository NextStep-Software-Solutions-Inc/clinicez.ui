"use client";

import { GetAppointment, GetAppointmentFilter, GetAppointments } from "@actions/appointments/appointments.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgAppointments = (filter: GetAppointmentFilter) => {
  const { orgUid } = filter
  const fetcher = (args: string) => self.get<GetAppointments>(args)
  const searchParams = new URLSearchParams()
  Object.entries(filter).forEach(([key, value]) => {
    if(value) searchParams.set(key, value?.toString())
  })
  return useSWR(`/api/organizations/${orgUid}/appointments?${searchParams.toString()}`, fetcher)
}

type UseOrgAppointment = {
    orgId: string,
    appointmentId: number
}
export const useOrgAppointment = ({orgId, appointmentId}:UseOrgAppointment) => {
  
  const fetcher = (args: string) => self.get<GetAppointment>(args)
  return useSWR(() => !!appointmentId ? `/api/organizations/${orgId}/appointments/${appointmentId}` : null, fetcher)
}