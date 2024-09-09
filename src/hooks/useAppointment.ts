"use client";

import { GetAppointment, GetAppointmentFilter, GetAppointments } from "@actions/appointments/appointments.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgAppointments = (filter: GetAppointmentFilter) => {
  const { orgUid, status, routedAptStatus, sort } = filter
  const fetcher = (...args: any) => self.get<GetAppointments>(args)
  const searchParams = new URLSearchParams()
  if(status) searchParams.set('status', status)
  if(routedAptStatus) searchParams.set('routedAptStatus', routedAptStatus)
  if(sort) searchParams.set('sort', sort)
    
  return useSWR(`/api/organizations/${orgUid}/appointments?${searchParams.toString()}`, fetcher)
}


type UseOrgAppointment = {
    orgId: string,
    appointmentId: number
}
export const useOrgAppointment = ({orgId, appointmentId}:UseOrgAppointment) => {
  
  const fetcher = (...args: any) => self.get<GetAppointment>(args)
  return useSWR(() => !!appointmentId ? `/api/organizations/${orgId}/appointments/${appointmentId}` : null, fetcher)
}