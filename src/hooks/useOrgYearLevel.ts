import { GetOrganizationYearLevels } from "@actions/organizations/org-year-level.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgYearLevels = (orgUid: string) => {
  const fetcher = (args: string) => self.get<GetOrganizationYearLevels>(args)
  const searchParams = new URLSearchParams({ orgUid })
  return useSWR(`/api/org-year-levels?${searchParams.toString()}`, fetcher)
}