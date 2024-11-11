"use client";

import { GetConsultationNotes } from "@actions/consultation/consultation-notes.action";
import { self } from "@services/request"
import useSWR from "swr"

type UseOrgConsultationNotes = {
  orgUid: string,
  consultationId: number
}

export const useConsultationNotes = ({orgUid, consultationId}: UseOrgConsultationNotes) => {
  const fetcher = (args: string) => self.get<GetConsultationNotes>(args)
  return useSWR(() => !!consultationId ? `/api/organizations/${orgUid}/consultations/${consultationId}/notes` : null, fetcher)
}