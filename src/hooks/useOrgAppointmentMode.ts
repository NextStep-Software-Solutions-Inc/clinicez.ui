import { GetAppointmentModes } from "@actions/appointments/appointment-mode.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgAppointmentModes = (orgUid: string) => {
  const fetcher = (args: string) => self.get<GetAppointmentModes>(args)
  return useSWR(`/api/clinics/${orgUid}/appointment-modes`, fetcher)
}