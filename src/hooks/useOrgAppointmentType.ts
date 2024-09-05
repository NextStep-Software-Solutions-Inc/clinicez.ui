import { GetAppointmentTypes } from "@actions/appointments/appointment-type.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgAppointmentTypes = (orgUid: string) => {
  const fetcher = (...args: any) => self.get<GetAppointmentTypes>(args)
  return useSWR(`/api/organizations/${orgUid}/appointment-types`, fetcher)
}