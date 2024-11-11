import { GetOrgRoleInitialPermissions } from "@/actions/org-role-initial-permission.action"
import { self } from "@services/request"
import useSWR from "swr"

type UseOrgRoleInitialPermissionsFilters = {
  orgUid: string
  orgRoleId: number
}
export const useOrgRoleInitialPermissions = ({orgUid, orgRoleId}: UseOrgRoleInitialPermissionsFilters) => {
  const fetcher = (args: string) => self.get<GetOrgRoleInitialPermissions>(args)
  const searchParams = new URLSearchParams()
  if(orgRoleId) searchParams.append("orgRoleId", orgRoleId.toString())
  return useSWR(`/api/organizations/${orgUid}/org-setting/role-initial-permissions?${searchParams.toString()}`,fetcher)
}