"use client";

import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";
import { self } from "@services/request"
import useSWR from "swr"

export const useConsultations = () => {
  const fetcher = (args: string) => self.get<GetConsultationRecord>(args)
  return useSWR('/api/consultations', fetcher)
}

type UseOrgConsultation = {
    orgUid: string,
    consultationId: number
}
export const useConsultation = ({orgUid, consultationId}: UseOrgConsultation) => {
  const fetcher = (args: string) => self.get<GetConsultationRecord>(args)
  return useSWR(() => !!consultationId ? `/api/organizations/${orgUid}/consultations/${consultationId}` : null, fetcher)
}