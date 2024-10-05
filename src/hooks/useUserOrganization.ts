"use client";

import { GetUserOrganizations, GetUserOrgFilterType } from "@actions/users/user-organization.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useUserOrganizations = (filter: GetUserOrgFilterType, enable = true) => {
  const fetcher = (...args:any) => self.get<GetUserOrganizations>(args)
  const searchParams = new URLSearchParams()
  Object.entries(filter).forEach(([key, value]) => {
    if(value) searchParams.append(key, value.toString())
  })
  return useSWR(() => enable ? `/api/user-organizations?${searchParams.toString()}` : null, fetcher)
}