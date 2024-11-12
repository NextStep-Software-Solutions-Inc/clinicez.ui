import { GetOrganizationRoles } from "@actions/organizations/organization-role.action"
import { self } from "@services/request"
import useSWR from "swr"

type UserRoleFilter = {
  userId?: string | null
}

export const useOrganizationRoles = (orgId: string, filter?: UserRoleFilter) => {
  const fetcher = (args: string) => self.get<GetOrganizationRoles>(args)
  const searParams = new URLSearchParams()
  Object.entries(filter ?? {}).forEach(([key, value]) => {
    if(value) searParams.set(key, value.toString())
  })
 
  return useSWR(`/api/organizations/${orgId}/roles?${searParams.toString()}`,fetcher)
}