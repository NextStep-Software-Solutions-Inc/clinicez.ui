import { GetOrganizations } from "@actions/organization.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrg = (userId?: string | null) => {
  const fetcher = (args:any) => self.get<GetOrganizations>(args)
  const searchParams = new URLSearchParams()

  if(userId) {
    searchParams.append("userId", userId) 
  }
  return useSWR(`/api/organizations?${searchParams.toString()}`, fetcher)
}