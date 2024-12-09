import { GetOrganizationRoles, GetOrganizationRolesFilters } from "@actions/organizations/organization-role.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrganizationRoles = (filters: GetOrganizationRolesFilters) => {

  const fetcher = (args: string) => self.get<GetOrganizationRoles>(args)
  const searParams = new URLSearchParams()
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if(value) searParams.set(key, value.toString())
  })
 
  return useSWR(`/api/organizations/${filters?.orgUid}/roles?${searParams.toString()}`,fetcher)
}