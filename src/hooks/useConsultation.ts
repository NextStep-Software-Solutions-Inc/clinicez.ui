"use client";

import { GetConsultationTicket, GetConsultationTickets } from "@actions/consultation/consultation-ticket.action";
import { self } from "@services/request"
import useSWR from "swr"


type UseConsultations = {
  orgUid: string
  showArchived?: boolean
  userId?: string
}

export const useConsultations = ({ orgUid, showArchived, userId }:UseConsultations) => {
  const fetcher = (args: string) => self.get<GetConsultationTickets>(args)
  const searchParams = new URLSearchParams()
  if(showArchived) searchParams.append('showArchived', showArchived.toString())
  if(userId) searchParams.append('userId', userId)
  return useSWR(`/api/organizations/${orgUid}/consultations?${searchParams.toString()}`, fetcher)
}



type UseOrgConsultation = {
    orgUid: string,
    consultationId: number
}
export const useConsultation = ({orgUid, consultationId}: UseOrgConsultation) => {
  const fetcher = (args: string) => self.get<GetConsultationTicket>(args)
  return useSWR(() => !!consultationId ? `/api/organizations/${orgUid}/consultations/${consultationId}` : null, fetcher)
}