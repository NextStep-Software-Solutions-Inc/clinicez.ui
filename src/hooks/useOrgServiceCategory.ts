import { GetClinicServiceCategories } from "@actions/organizations/clinic-service-category.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgServiceCategories = (orgUid?: string) => {
  const fetcher = (args: string) => self.get<GetClinicServiceCategories>(args)
  const searchParams = new URLSearchParams()
  if(orgUid) searchParams.set('orgUid', orgUid)
  return useSWR(`/api/service-categories?${searchParams.toString()}`, fetcher)
}
