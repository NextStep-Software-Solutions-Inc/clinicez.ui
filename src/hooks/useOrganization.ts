import { GetOrganization, GetOrganizations, GetOrganizationsFilters } from "@actions/organizations/organization.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrganizations = (filters: GetOrganizationsFilters) => {
  const fetcher = (args:string) => self.get<GetOrganizations>(args)
  const searchParams = new URLSearchParams()

  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if(value) searchParams.set(key, value.toString())
  })
  return useSWR(`/api/organizations?${searchParams.toString()}`, fetcher)
}

export const useOrganization = (key: number | string) => {
  const fetcher = (args:string) => self.get<GetOrganization>(args)
  return useSWR(`/api/organizations/${key}`, fetcher)
}