import { GetClinicRoles } from "@/actions/clinics/clinic-role.action"
import { self } from "@services/request"
import useSWR from "swr"

type UserRoleFilter = {
  userId?: string | null
}

export const useClinicRoles = (clinicUid: string, filter?: UserRoleFilter) => {
  const fetcher = (args: string) => self.get<GetClinicRoles>(args)
  const searParams = new URLSearchParams()
  Object.entries(filter ?? {}).forEach(([key, value]) => {
    if(value) searParams.set(key, value.toString())
  })
  return useSWR(`/api/clinics/${clinicUid}/roles?${searParams.toString()}`,fetcher)
}