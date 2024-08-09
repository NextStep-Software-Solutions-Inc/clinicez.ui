import { GetOrgDepartments } from "@actions/organizations/org-department.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgDepartments = (orgId: string) => {
  const fetcher = (...args: any) => self.get<GetOrgDepartments>(args)
  return useSWR(`/api/org-departments?orgId=${orgId}`, fetcher)
}