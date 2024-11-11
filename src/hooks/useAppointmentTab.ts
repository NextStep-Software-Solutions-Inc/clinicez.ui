import { GetAppointmentTabs } from "@actions/appointment-tab.action"
import { GetOrgAppointmentTabs } from "@actions/organizations/org-appointment-tab..action"
import { self } from "@services/request"
import useSWR from "swr"

export const useAppointmentTabs = () => {
  const fetcher = (args: string) => self.get<GetAppointmentTabs>(args)
  const searchParams = new URLSearchParams()
  return useSWR(`/api/appointment-tabs?${searchParams.toString()}`,fetcher)
}

export const useOrgAppointmentTabs = (orgUid: string) => {
  const fetcher = (args: string) => self.get<GetOrgAppointmentTabs>(args)
  const searchParams = new URLSearchParams()
  return useSWR(`/api/organizations/${orgUid}/appointment-tabs?${searchParams.toString()}`,fetcher)
}