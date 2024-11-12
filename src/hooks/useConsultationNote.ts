"use client";

import { GetConsultationNotes } from "@actions/consultation/consultation-notes.action";
import { self } from "@services/request"
import useSWR from "swr"

type UseClinicConsultationNotes = {
  clinicUid: string,
  consultationId: number
}

export const useConsultationNotes = ({clinicUid, consultationId}: UseClinicConsultationNotes) => {
  const fetcher = (args: string) => self.get<GetConsultationNotes>(args)
  return useSWR(() => !!consultationId ? `/api/clinics/${clinicUid}/consultations/${consultationId}/notes` : null, fetcher)
}