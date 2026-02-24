"use client";

import { GetUserTimeSlots } from "@actions/schedule/time-slot.actions";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

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

/**
 * Serialisable subset of BookAppointmentForm — excludes File[] (not
 * JSON-serialisable) and availabilities (transient SWR data). Dates are
 * stored as ISO strings and revived on read.
 */
type PersistedDraft = {
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

type StorageEnvelope = {
  expiresAt: number
  draft: PersistedDraft
}

// ---------------------------------------------------------------------------
// TTL constants
// ---------------------------------------------------------------------------

/** Draft expires 30 minutes after last write. */
const DRAFT_TTL_MS = 30 * 60 * 1000
const STORAGE_KEY = "clinicez.v2.booking_draft"

// ---------------------------------------------------------------------------
// Custom localStorage adapter with TTL
// ---------------------------------------------------------------------------

const ttlStorage = createJSONStorage<StorageEnvelope | null>(() => {
  // SSR guard: jotai/utils requires a Storage-like object
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    } as unknown as Storage;
  }
  return localStorage;
});

/**
 * Raw atom that holds `{ expiresAt, draft }` in localStorage.
 * Consumers should use `bookAppointmentAtom` and
 * `clearBookingDraftAtom` instead.
 */
const _draftStorageAtom = atomWithStorage<StorageEnvelope | null>(
  STORAGE_KEY,
  null,
  ttlStorage,
  { getOnMount: true }
);

// ---------------------------------------------------------------------------
// Derived atom — public API (identical shape as before)
// ---------------------------------------------------------------------------

/**
 * The main booking wizard atom.
 *
 * - On **read**: hydrates `BookAppointmentForm` from the persisted draft
 *   (expires after `DRAFT_TTL_MS`); `attachments` and `availabilities` are
 *   always `undefined` (not serialisable).
 * - On **write**: persists the serialisable fields back to localStorage with
 *   a fresh TTL; `attachments` / `availabilities` are held in-memory only.
 */
export const bookAppointmentAtom = atom<
  BookAppointmentForm,
  [BookAppointmentForm | ((prev: BookAppointmentForm) => BookAppointmentForm)],
  void
>(
  (get): BookAppointmentForm => {
    const envelope = get(_draftStorageAtom);
    if (!envelope) return {};
    if (Date.now() > envelope.expiresAt) {
      // Lazily remove the expired envelope from localStorage
      // (write happens asynchronously via the atom setter)
      return {};
    }

    const d = envelope.draft;
    return {
      clinicUid: d.clinicUid,
      appointmentTypeId: d.appointmentTypeId,
      serviceId: d.serviceId,
      hpId: d.hpId,
      hpUserId: d.hpUserId,
      modeId: d.modeId,
      preferredDate: d.preferredDate ? new Date(d.preferredDate) : undefined,
      selectedTimeSlot: d.selectedTimeSlot
        ? {
            start: new Date(d.selectedTimeSlot.start),
            end: new Date(d.selectedTimeSlot.end),
          }
        : undefined,
      subject: d.subject,
      chiefComplaint: d.chiefComplaint,
      certify: d.certify,
      agreeTerms: d.agreeTerms,
      agreePrivacy: d.agreePrivacy,
      // `attachments` and `availabilities` are not persisted
    };
  },
  (get, set, update) => {
    const prev = get(bookAppointmentAtom);
    const next = typeof update === "function" ? update(prev) : update;

    // Persist serialisable fields with a fresh TTL
    const draft: PersistedDraft = {
      clinicUid: next.clinicUid,
      appointmentTypeId: next.appointmentTypeId,
      serviceId: next.serviceId,
      hpId: next.hpId,
      hpUserId: next.hpUserId,
      modeId: next.modeId,
      preferredDate: next.preferredDate?.toISOString(),
      selectedTimeSlot: next.selectedTimeSlot
        ? {
            start: next.selectedTimeSlot.start.toISOString(),
            end: next.selectedTimeSlot.end.toISOString(),
          }
        : undefined,
      subject: next.subject,
      chiefComplaint: next.chiefComplaint,
      certify: next.certify,
      agreeTerms: next.agreeTerms,
      agreePrivacy: next.agreePrivacy,
    };

    set(_draftStorageAtom, { expiresAt: Date.now() + DRAFT_TTL_MS, draft });
  }
);

// ---------------------------------------------------------------------------
// Helper atom — clear draft (call on success or explicit cancel)
// ---------------------------------------------------------------------------

/**
 * Write-only atom. Call it to wipe the persisted draft from localStorage.
 * Used on successful submission and when starting a fresh booking.
 *
 * ```ts
 * const [, clearDraft] = useAtom(clearBookingDraftAtom)
 * clearDraft()
 * ```
 */
export const clearBookingDraftAtom = atom<null, [], void>(
  null,
  (_get, set) => {
    set(_draftStorageAtom, null);
  }
);
