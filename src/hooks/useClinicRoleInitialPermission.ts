import { GetClinicRoleInitialPermissions } from "@/actions/clinic-role-initial-permission.action"
import { self } from "@services/request"
import useSWR from "swr"

type UseClinicRoleInitialPermissionsFilters = {
  clinicUid: string
  clinicRoleId: number
}
export const useClinicRoleInitialPermissions = ({clinicUid, clinicRoleId}: UseClinicRoleInitialPermissionsFilters) => {
  const fetcher = (args: string) => self.get<GetClinicRoleInitialPermissions>(args)
  const searchParams = new URLSearchParams()
  if(clinicRoleId) searchParams.append("clinicRoleId", clinicRoleId.toString())
  return useSWR(`/api/clinics/${clinicUid}/clinic-setting/role-initial-permissions?${searchParams.toString()}`,fetcher)
}