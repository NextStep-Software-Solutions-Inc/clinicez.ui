import { GetOrgPrograms } from "@actions/organizations/org-program.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgPrograms = (orgId: string) => {
  const fetcher = (args: string) => self.get<GetOrgPrograms>(args)
  const searchParams = new URLSearchParams({orgId})
  return useSWR(`/api/org-programs?${searchParams.toString()}`, fetcher)
}