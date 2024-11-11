import { atom } from "jotai";

export type SessionClinic = {
    clinicId: number
    clinicUid: string
    tenantId: number
    tenantUid: string
  }

export const sessionClinicAtom = atom<SessionClinic | null>(null)