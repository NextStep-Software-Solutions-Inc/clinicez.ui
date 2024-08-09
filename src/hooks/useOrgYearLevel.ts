import { GetOrgYearLevels } from "@actions/organizations/org-year-level.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgYearLevels = (orgId: string) => {
  const fetcher = (...args: any) => self.get<GetOrgYearLevels>(args)
  return useSWR(`/api/org-year-levels?orgId=${orgId}`, fetcher)
}