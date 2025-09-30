import { GetOrgColleges } from "@actions/organizations/org-college.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgColleges = (orgUid: string) => {
  const fetcher = (args: string) => self.get<GetOrgColleges>(args)
  const searchParams = new URLSearchParams({ orgUid })
  return useSWR(`/api/org-colleges?${searchParams.toString()}`, fetcher)
}