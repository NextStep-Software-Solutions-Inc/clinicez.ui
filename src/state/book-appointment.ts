"use client";

import { GetUserTimeSlots } from "@actions/schedule/time-slot.actions";
import { atom } from "jotai";

export type BookAppointmentForm = Partial<{
    orgUid: string
    appointmentTypeId:  number
    serviceId: number
    hpUserId: string
    hpEmail: string,
    modeId: number
    selectedTimeSlot: {
        start: Date
        end: Date
    }
    availabilities: GetUserTimeSlots["data"]
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
