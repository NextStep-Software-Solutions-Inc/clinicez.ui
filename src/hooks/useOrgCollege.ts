import { GetOrgColleges } from "@actions/org-college.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgCollege = (orgId: string) => {
  const fetcher = (...args: any) => self.get<GetOrgColleges>(args)
  return useSWR(`/api/org-college?orgId=${orgId}`, fetcher)
}