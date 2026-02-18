import { GetAppointmentModes } from "@actions/appointments/appointment-mode.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useClinicAppointmentModes = (clinicUid: string) => {
  const fetcher = (args: string) => self.get<GetAppointmentModes>(args)
  return useSWR(`/api/clinics/${clinicUid}/appointment-modes`, fetcher)
}