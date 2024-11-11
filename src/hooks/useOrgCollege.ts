import { GetOrgColleges } from "@actions/organizations/org-college.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgColleges = (orgId: string) => {
  const fetcher = (args: string) => self.get<GetOrgColleges>(args)
  const searchParams = new URLSearchParams({orgId})
  return useSWR(`/api/org-colleges?${searchParams.toString()}`, fetcher)
}