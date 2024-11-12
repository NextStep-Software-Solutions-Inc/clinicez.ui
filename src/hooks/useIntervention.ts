
"use client";

import { GetInterventions } from "@actions/consultation/intervention.action";
import { self } from "@services/request"
import useSWR from "swr"

type UseInterventions = {
  clinicUid: string,
  consultationTicketId: number
}

export const useInterventions = ({clinicUid, consultationTicketId}: UseInterventions) => {
  const fetcher = (args: string) => self.get<GetInterventions>(args)
  return useSWR(() => !!consultationTicketId ? `/api/clinics/${clinicUid}/consultations/${consultationTicketId}/interventions` : null, fetcher)
}