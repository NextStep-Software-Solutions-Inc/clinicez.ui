import { GetOrgPrograms } from "@actions/org-program.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgProgram = (orgId: string) => {
  const fetcher = (...args: any) => self.get<GetOrgPrograms>(args)
  return useSWR(`/api/org-program?orgId=${orgId}`, fetcher)
}