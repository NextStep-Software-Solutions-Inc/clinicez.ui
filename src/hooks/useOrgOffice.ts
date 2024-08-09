import { GetOrgOffices } from "@actions/organizations/org-office.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgOffices = (orgId: string) => {
  const fetcher = (...args: any) => self.get<GetOrgOffices>(args)
  return useSWR(`/api/org-offices?orgId=${orgId}`, fetcher)
}