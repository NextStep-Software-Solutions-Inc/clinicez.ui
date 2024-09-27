"use client";

import { GetUserTimeSlots } from "@actions/schedule/time-slot.actions";
import { self } from "@services/request";
import useSWR from "swr";

type UseTimeSlotsArgs = {
    userId: string
    serviceId?: number
    appointmentTypeId?: number
}
export const useTimeSlots = ({userId, serviceId, appointmentTypeId}: UseTimeSlotsArgs) => {
  const fetcher = (args:string) => self.get<GetUserTimeSlots>(args)

  const searchParams = new URLSearchParams()
  if(serviceId) searchParams.set("serviceId", serviceId.toString())
  if(appointmentTypeId) searchParams.set("appointmentTypeId", appointmentTypeId.toString())

  const refreshInterval = 1000 * 60 * 5;
  return useSWR(userId ? `/api/users/${userId}/availabilities?${searchParams.toString()}`: null, fetcher, {
    refreshInterval,
    revalidateOnMount: true,
  })
}