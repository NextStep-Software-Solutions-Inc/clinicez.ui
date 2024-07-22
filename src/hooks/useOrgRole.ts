import { GetOrganizationRoles } from "@actions/organization.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgRole = (orgId: string) => {
  const fetcher = (...args: any) => self.get<GetOrganizationRoles>(args)
  return useSWR(`/api/organizations/${orgId}/roles`,fetcher)
}