import { GetOrganization, GetOrganizations } from "@actions/organizations/organization.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrganizations = (userId?: string | null) => {
  const fetcher = (args:string) => self.get<GetOrganizations>(args)
  const searchParams = new URLSearchParams()

  if(userId) searchParams.append("userId", userId) 
  return useSWR(`/api/organizations?${searchParams.toString()}`, fetcher)
}

export const useOrganization = (key: number | string) => {
  const fetcher = (args:string) => self.get<GetOrganization>(args)
  return useSWR(`/api/organizations/${key}`, fetcher)
}