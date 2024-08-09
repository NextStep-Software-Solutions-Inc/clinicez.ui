"use client";

import { atom } from "jotai";

export type BookAppointmentForm = Partial<{
    orgUid?: string
    appointmentTypeId?: number
    serviceId: number
    doctor: string
    modeId: number
    timeSlotId: number
    subject: string
    chiefComplaint: string
    certify: boolean
    agreeTerms: boolean
    agreePrivacy: boolean
  }>

export const bookAppointmentAtom = atom<BookAppointmentForm>({});
