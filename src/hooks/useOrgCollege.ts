import { GetOrgColleges } from "@actions/organizations/org-college.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgColleges = (orgId: string) => {
  const fetcher = (...args: any) => self.get<GetOrgColleges>(args)
  return useSWR(`/api/org-colleges?orgId=${orgId}`, fetcher)
}