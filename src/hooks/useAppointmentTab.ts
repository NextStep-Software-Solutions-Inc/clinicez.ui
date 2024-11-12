import { GetAppointmentTabs } from "@actions/appointment-tab.action"
import { GetClinicAppointmentTabs } from "@/actions/clinics/clinic-appointment-tab..action"
import { self } from "@services/request"
import useSWR from "swr"

export const useAppointmentTabs = () => {
  const fetcher = (args: string) => self.get<GetAppointmentTabs>(args)
  const searchParams = new URLSearchParams()
  return useSWR(`/api/appointment-tabs?${searchParams.toString()}`,fetcher)
}

export const useClinicAppointmentTabs = (clinicUid: string) => {
  const fetcher = (args: string) => self.get<GetClinicAppointmentTabs>(args)
  const searchParams = new URLSearchParams()
  return useSWR(`/api/clinics/${clinicUid}/appointment-tabs?${searchParams.toString()}`,fetcher)
}