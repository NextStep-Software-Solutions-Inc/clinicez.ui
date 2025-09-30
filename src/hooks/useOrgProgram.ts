import { GetOrgPrograms } from "@actions/organizations/org-program.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgPrograms = (orgUid: string) => {
  const fetcher = (args: string) => self.get<GetOrgPrograms>(args)
  const searchParams = new URLSearchParams({ orgUid })
  return useSWR(`/api/org-programs?${searchParams.toString()}`, fetcher)
}