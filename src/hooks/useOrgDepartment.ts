import { GetOrgDepartments } from "@actions/organizations/org-department.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgDepartments = (orgId: string) => {
  const fetcher = (args: string) => self.get<GetOrgDepartments>(args)
  const searchParams = new URLSearchParams({orgId})
  return useSWR(`/api/org-departments?${searchParams.toString()}`, fetcher)
}