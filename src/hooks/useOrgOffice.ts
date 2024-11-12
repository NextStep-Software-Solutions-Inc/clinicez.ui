import { GetOrgOffices } from "@actions/organizations/org-office.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgOffices = (orgId: string) => {
  const fetcher = (args: string) => self.get<GetOrgOffices>(args)
  const searchParams = new URLSearchParams({orgId})
  return useSWR(`/api/org-offices?${searchParams.toString()}`, fetcher)
}