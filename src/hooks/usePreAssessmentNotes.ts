"use client";

import { GetPreAssessmentNotes } from '@actions/appointments/pre-assessment-note.action';
import { self } from "@services/request"
import useSWR from "swr"

type UsePreAssessmentNotes = {
  orgUid: string,
  appointmentId: number
}

export const usePreAssessmentNotes = ({orgUid, appointmentId}: UsePreAssessmentNotes) => {
  const fetcher = (args: string) => self.get<GetPreAssessmentNotes>(args)
  return useSWR(() => (orgUid && appointmentId) ? `/api/organizations/${orgUid}/appointments/${appointmentId}/pre-consultation-notes` : null, fetcher)
}