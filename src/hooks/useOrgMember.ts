"use client";

import { GetOrgMembers, GetOrgMembersFilters } from "@actions/organizations/org-member.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgMembers = (filter: GetOrgMembersFilters, enable = true) => {

  const fetcher = (args: string) => self.get<GetOrgMembers>(args)
  const searchParams = new URLSearchParams()
  Object.entries(filter).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)))
    }
    else if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  })
  return useSWR(() => enable ? `/api/org-members?${searchParams.toString()}` : null, fetcher)
}
