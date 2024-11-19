"use client";

import { GetConsultationTicket, GetConsultationTickets, GetConsultationTicketsFilters } from "@actions/consultation/consultation-ticket.action";
import { self } from "@services/request"
import useSWR from "swr"


type UseConsultations = GetConsultationTicketsFilters & {
}

export const useConsultations = ({ clinicUid, showArchived, userId }:UseConsultations) => {
  const fetcher = (args: string) => self.get<GetConsultationTickets>(args)
  const searchParams = new URLSearchParams()
  
  if(showArchived) searchParams.append('showArchived', showArchived.toString())
  if(userId) searchParams.append('userId', userId)
  return useSWR(`/api/clinics/${clinicUid}/consultations?${searchParams.toString()}`, fetcher)
}

type UseClinicConsultation = {
    clinicUid: string,
    consultationId: number
}
export const useConsultation = ({clinicUid, consultationId}: UseClinicConsultation) => {
  const fetcher = (args: string) => self.get<GetConsultationTicket>(args)
  return useSWR(() => !!consultationId ? `/api/clinics/${clinicUid}/consultations/${consultationId}` : null, fetcher)
}