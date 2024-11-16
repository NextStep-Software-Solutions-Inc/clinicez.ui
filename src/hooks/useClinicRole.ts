import { GetClinicRoles } from "@/actions/clinics/clinic-role.action"
import { ClinicMemberStatus } from "@/types"
import { self } from "@services/request"
import useSWR from "swr"

type UserRoleFilter = {
  userId?: string
  roleName?: string,
  status?: ClinicMemberStatus
}

export const useClinicRoles = (filter: UserRoleFilter) => {
    
  const fetcher = (args: string) => self.get<GetClinicRoles>(args)
  const searParams = new URLSearchParams()
  Object.entries(filter ?? {}).forEach(([key, value]) => {
    if(value) searParams.set(key, value.toString())
  })
  return useSWR(`/api/clinic-roles?${searParams.toString()}`,fetcher)
}