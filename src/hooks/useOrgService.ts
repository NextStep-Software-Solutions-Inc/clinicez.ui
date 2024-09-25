import { GetOrgServices } from "@actions/organizations/org-service.action"
import { self } from "@services/request"
import useSWR from "swr"

type UseOrgServicesFilter = {
  orgUid: string,
  categoryId?: string
}
export const useOrgServices = (filter: UseOrgServicesFilter) => {
  const { orgUid, categoryId } = filter
  const fetcher = (...args:any) => self.get<GetOrgServices>(args)
  const searchParams = new URLSearchParams()

  if(orgUid) searchParams.set('orgUid', orgUid)
  if(categoryId) searchParams.set('categoryId', categoryId)

  return useSWR(`/api/services?${searchParams.toString()}`, fetcher)
}
