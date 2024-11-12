"use client";

import { GetPreAssessmentNotes } from '@actions/appointments/pre-assessment-note.action';
import { self } from "@services/request"
import useSWR from "swr"

type UsePreAssessmentNotes = {
  clinicUid: string,
  appointmentId: number
}

export const usePreAssessmentNotes = ({clinicUid, appointmentId}: UsePreAssessmentNotes) => {
  const fetcher = (args: string) => self.get<GetPreAssessmentNotes>(args)
  return useSWR(() => (clinicUid && appointmentId) ? `/api/clinics/${clinicUid}/appointments/${appointmentId}/pre-consultation-notes` : null, fetcher)
}