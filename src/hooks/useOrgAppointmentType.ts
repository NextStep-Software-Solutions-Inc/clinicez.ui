import { GetAppointmentTypes } from "@actions/appointments/appointment-type.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgAppointmentTypes = (clinicUid: string) => {
  const fetcher = (args: string) => self.get<GetAppointmentTypes>(args)
  return useSWR(`/api/clinics/${clinicUid}/appointment-types`, fetcher)
}