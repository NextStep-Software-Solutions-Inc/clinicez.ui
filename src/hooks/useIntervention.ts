
"use client";

import { GetInterventions } from "@actions/consultation/intervention.action";
import { self } from "@services/request"
import useSWR from "swr"

type UseInterventions = {
  orgUid: string,
  consultationRecordId: number
}

export const useInterventions = ({orgUid, consultationRecordId}: UseInterventions) => {
  const fetcher = (args: string) => self.get<GetInterventions>(args)
  return useSWR(() => !!consultationRecordId ? `/api/organizations/${orgUid}/consultations/${consultationRecordId}/interventions` : null, fetcher)
}