import { GetOrgYearLevels } from "@actions/org-year-level.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgYearLevel = (orgId: string) => {
  const fetcher = (...args: any) => self.get<GetOrgYearLevels>(args)
  return useSWR(`/api/org-year-level?orgId=${orgId}`, fetcher)
}