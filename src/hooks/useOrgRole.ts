import { GetClinicRoles } from "@actions/organizations/organization-role.action"
import { self } from "@services/request"
import useSWR from "swr"

type UserRoleFilter = {
  userId?: string | null
}

export const useOrgRoles = (orgId: string, filter?: UserRoleFilter) => {
  const fetcher = (...args: any) => self.get<GetClinicRoles>(args)
  const searParams = new URLSearchParams()
  if(filter) {
    if(filter.userId) searParams.set('userId', filter.userId)
  }
  return useSWR(`/api/organizations/${orgId}/roles?${searParams.toString()}`,fetcher)
}