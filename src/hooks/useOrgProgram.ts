import { GetOrgPrograms } from "@actions/organizations/org-program.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgPrograms = (orgId: string) => {
  const fetcher = (...args: any) => self.get<GetOrgPrograms>(args)
  return useSWR(`/api/org-programs?orgId=${orgId}`, fetcher)
}