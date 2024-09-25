"use client";

import { GetSystems } from "@actions/system.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useSystems = (orgUid?: string) => {
  const fetcher = (args:string) => self.get<GetSystems>(args)
  const searchParams = new URLSearchParams()
  if(orgUid) searchParams.set("orgUid", orgUid)
  return useSWR(`/api/systems?${searchParams.toString()}`, fetcher)
}
