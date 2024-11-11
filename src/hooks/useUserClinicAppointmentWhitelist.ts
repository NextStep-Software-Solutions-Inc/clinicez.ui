"use client";

import { GetUserAppointmentWhitelist } from "@actions/users/user-appointment-whitelist";
import { self } from "@services/request"
import useSWR from "swr"

export const useUserClinicAppointmentWhitelist = (clinicsUid: string, userId?: string,) => {
  const fetcher = (args:string) => self.get<GetUserAppointmentWhitelist>(args)
  const searchParams = new URLSearchParams()
  if(userId) searchParams.append('userId', userId)
  return useSWR(`/api/clinics/${clinicsUid}/appointment-whitelist-filter?${searchParams.toString()}`, fetcher)
}
