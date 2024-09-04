"use client";

import { getHPsTimeSlots } from "@actions/schedule/time-slot.actions";
import { atom } from "jotai";

export type BookAppointmentForm = Partial<{
    orgUid: string
    appointmentTypeId:  number
    serviceId: number
    hpEmail: string,
    modeId: number
    selectedTimeSlot: {
        start: Date
        end: Date
    }
    availabilities: Awaited<ReturnType<typeof getHPsTimeSlots>>["data"]
    preferredDate?: Date
    subject: string
    chiefComplaint: string
    certify: boolean
    agreeTerms: boolean
    agreePrivacy: boolean
    attachments: File[]
  }>

export const bookAppointmentAtom = atom<BookAppointmentForm>({
});
