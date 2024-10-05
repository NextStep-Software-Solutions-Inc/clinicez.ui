import { GetOrgAppointmentConfig } from "@actions/appointments/appointment-config.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgAppointmentConfig = (orgUid: string) => {
  const fetcher = (args:any) => self.get<GetOrgAppointmentConfig>(args)
  return useSWR(`/api/organizations/${orgUid}/org-setting/appointment-config`, fetcher)

}
