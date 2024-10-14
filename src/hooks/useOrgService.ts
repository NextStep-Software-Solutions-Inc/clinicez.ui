import { GetOrgServices } from "@actions/organizations/org-service.action"
import { self } from "@services/request"
import useSWR from "swr"

type UseOrgServicesFilter = {
  orgUid: string,
  categoryId?: number
}
export const useOrgServices = (filter: UseOrgServicesFilter) => {
  const fetcher = (...args:any) => self.get<GetOrgServices>(args)
  const searchParams = new URLSearchParams()

  Object.entries(filter).forEach(([key, value]) => {
    if(value) searchParams.set(key, value.toString())
  })
  
  return useSWR(`/api/services?${searchParams.toString()}`, fetcher)
}
