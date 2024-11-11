
"use client";

import { GetInterventions } from "@actions/consultation/intervention.action";
import { self } from "@services/request"
import useSWR from "swr"

type UseInterventions = {
  orgUid: string,
  consultationTicketId: number
}

export const useInterventions = ({orgUid, consultationTicketId}: UseInterventions) => {
  const fetcher = (args: string) => self.get<GetInterventions>(args)
  return useSWR(() => !!consultationTicketId ? `/api/organizations/${orgUid}/consultations/${consultationTicketId}/interventions` : null, fetcher)
}