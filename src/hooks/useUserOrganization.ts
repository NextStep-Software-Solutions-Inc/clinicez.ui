import { GetUserOrganizations, GetUserOrgFilterType } from "@actions/users/user-organization.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useUserOrganizations = (filter:GetUserOrgFilterType, enable = true) => {
  const fetcher = (...args:any) => self.get<GetUserOrganizations>(args)
  const obj = {
    ...filter.userId ?{ userId: filter.userId } : {},
    ...filter.orgId ?{ orgId: filter.orgId } : {},
    ...filter.status ?{ status: filter.status } : {},
    ...filter.roleId ?{ roleId: filter.roleId.toString() } : {},
    ...filter.pageNumber ?{ pageNumber: filter.pageNumber.toString() } : {},
    ...filter.pageSize ?{ pageSize: filter.pageSize.toString() } : {},
  }
  const query = new URLSearchParams(obj).toString()
  return useSWR(() => enable ? `/api/user-organizations?${query}` : null, fetcher)
}