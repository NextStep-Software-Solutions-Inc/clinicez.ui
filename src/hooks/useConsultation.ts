"use client";

import { GetConsultationTicket, GetConsultationTickets } from "@actions/consultation/consultation-ticket.action";
import { self } from "@services/request"
import useSWR from "swr"


type UseConsultations = {
  orgUid: string
  showArchived?: boolean
  // hpId: number
}

export const useConsultations = ({ orgUid, showArchived }:UseConsultations) => {
  const fetcher = (args: string) => self.get<GetConsultationTickets>(args)
  const searchParams = new URLSearchParams()
  if(showArchived) searchParams.append('showArchived', showArchived.toString())
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