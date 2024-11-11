"use client";

import { GetUserTimeSlots } from "@actions/schedule/time-slot.actions";
import { self } from "@services/request";
import useSWR from "swr";

type UseTimeSlotsArgs = {
    userId: string
    hpId: number
    serviceId?: number
    appointmentTypeId?: number
}
export const useTimeSlots = (filters: UseTimeSlotsArgs) => {
  const { userId } = filters
  const fetcher = (args:string) => self.get<GetUserTimeSlots>(args)
  const searchParams = new URLSearchParams()
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if(value) searchParams.set(key, value.toString())
  })

  const refreshInterval = 1000 * 60 * 5;
  return useSWR(userId ? `/api/users/${userId}/availabilities?${searchParams.toString()}`: null, fetcher, {
    refreshInterval,
    revalidateOnMount: true,
  })
}