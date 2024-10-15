"use client";

import { GetUserAppointmentWhitelist } from "@actions/users/user-appointment-whitelist";
import { self } from "@services/request"
import useSWR from "swr"

export const useUserOrgAppointmentWhitelist = (orgUid: string, userId?: string,) => {
  const fetcher = (args:string) => self.get<GetUserAppointmentWhitelist>(args)
  const searchParams = new URLSearchParams()
  if(userId) searchParams.append('userId', userId)
  return useSWR(`/api/organizations/${orgUid}/appointment-whitelist-filter?${searchParams.toString()}`, fetcher)
}
