"use client";

import { GetAppointment, GetAppointmentFilter, GetAppointments } from "@actions/appointments/appointments.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useClinicAppointments = (filter: GetAppointmentFilter) => {
  const { clinicUid } = filter
  const fetcher = (args: string) => self.get<GetAppointments>(args)
  const searchParams = new URLSearchParams()
  Object.entries(filter).forEach(([key, value]) => {
    if(value) searchParams.set(key, value?.toString())
  })
  return useSWR(`/api/clinics/${clinicUid}/appointments?${searchParams.toString()}`, fetcher)
}

type UseOrgAppointment = {
  clinicUid: string,
  appointmentId: number
}
export const useClinicAppointment = ({clinicUid, appointmentId}:UseOrgAppointment) => {
  
  const fetcher = (args: string) => self.get<GetAppointment>(args)
  return useSWR(() => !!appointmentId ? `/api/clinics/${clinicUid}/appointments/${appointmentId}` : null, fetcher)
}