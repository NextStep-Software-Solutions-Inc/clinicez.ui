import { GetAppointmentTypes } from "@actions/appointments/appointment-type.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgAppointmentTypes = (orgId: string) => {
  const fetcher = (...args: any) => self.get<GetAppointmentTypes>(args)
  return useSWR(`/api/organizations/${orgId}/appointment-types`, fetcher)
}