"use client";

import { GetPreConsultationNotes } from '@actions/appointments/pre-consultation-note.action';
import { self } from "@services/request"
import useSWR from "swr"

type UsePreConsultationNotes = {
  orgUid: string,
  appointmentId: number
}

export const usePreConsultationNotes = ({orgUid, appointmentId}: UsePreConsultationNotes) => {
  const fetcher = (args: string) => self.get<GetPreConsultationNotes>(args)
  return useSWR(() => !!appointmentId ? `/api/organizations/${orgUid}/appointments/${appointmentId}/pre-consultation-notes` : null, fetcher)
}