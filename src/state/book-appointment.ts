"use client";

import { GetUserTimeSlots } from "@actions/schedule/time-slot.actions";
import { atom } from "jotai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookAppointmentForm = Partial<{
  clinicUid: string
  bookAFriend: boolean
  requester: string
  orgUid: string
  appointmentTypeId: number
  serviceId: number
  hpId: number
  hpUserId: string
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

// ---------------------------------------------------------------------------
// Atom — simple in-memory state (localStorage persistence is handled in the
// BookAppointmentWizard component via useEffect to avoid complex jotai utils)
// ---------------------------------------------------------------------------

/**
 * The main booking wizard atom.
 * Serialisable fields are persisted to localStorage (with a 30-min TTL) by
 * `BookAppointmentWizard`; non-serialisable fields (`attachments`,
 * `availabilities`) are held in-memory only.
 */
export const bookAppointmentAtom = atom<BookAppointmentForm>({});

// ---------------------------------------------------------------------------
// Storage helpers (used by BookAppointmentWizard)
// ---------------------------------------------------------------------------

export const BOOKING_DRAFT_KEY = "clinicez.v2.booking_draft";
export const BOOKING_DRAFT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export type PersistedDraft = {
  clinicUid?: string
  appointmentTypeId?: number
  serviceId?: number
  hpId?: number
  hpUserId?: string
  modeId?: number
  /** ISO string */
  preferredDate?: string
  selectedTimeSlot?: { start: string; end: string }
  subject?: string
  chiefComplaint?: string
  certify?: boolean
  agreeTerms?: boolean
  agreePrivacy?: boolean
}

export type StorageEnvelope = {
  expiresAt: number
  draft: PersistedDraft
}
