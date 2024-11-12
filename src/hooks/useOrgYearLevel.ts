import { GetOrganizationYearLevels } from "@actions/organizations/org-year-level.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgYearLevels = (orgId: string) => {
  const fetcher = (args: string) => self.get<GetOrganizationYearLevels>(args)
  const searchParams = new URLSearchParams({orgId})
  return useSWR(`/api/org-year-levels?${searchParams.toString()}`, fetcher)
}