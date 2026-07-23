import useSWR, { mutate } from 'swr'
import {
    getPatientOverviewData,
    getPatientMedicalData,
    getPatientVitalsData,
    getPatientExamsData,
    getPatientObGynData,
    getPatientAddressesData,
    getPatientContactsData,
    getPatientLifestyleData,
    getPatientAllergiesData,
    getPatientVaccinationsData,
    getPatientDisabilitiesData,
    getPatientInsuranceData,
    getPatientNcdQuestionnaireData,
    getPatientDiagnosticsData,
} from '@/actions/patient-profile/get-patient-tab-data'
import type { PatientTabDataMap } from '@/types/patient-profile-tabs'

/** Maps each tab id to its dedicated single-purpose data fetcher. */
const TAB_DATA_FETCHERS: { [K in keyof PatientTabDataMap]: (userId?: string) => Promise<PatientTabDataMap[K] | null> } = {
    overview: getPatientOverviewData,
    medical: getPatientMedicalData,
    vitals: getPatientVitalsData,
    exams: getPatientExamsData,
    diagnostics: getPatientDiagnosticsData,
    obgyn: getPatientObGynData,
    addresses: getPatientAddressesData,
    contacts: getPatientContactsData,
    lifestyle: getPatientLifestyleData,
    allergies: getPatientAllergiesData,
    vaccinations: getPatientVaccinationsData,
    disabilities: getPatientDisabilitiesData,
    insurance: getPatientInsuranceData,
    ncdQuestionnaire: getPatientNcdQuestionnaireData,
}

/**
 * Builds the SWR cache key for a patient profile tab.
 * When `userId` is supplied (clinic-staff viewing a specific patient) it is
 * included in the key so each patient's data is cached independently.
 *
 * Export this constant builder to invalidate a tab's data from anywhere:
 *   import { buildPatientTabSWRKey } from '@/hooks/use-patient-tab'
 *   mutate(buildPatientTabSWRKey('vitals'))  // own profile
 *   mutate(buildPatientTabSWRKey('vitals', patientUserId))  // specific patient
 */
export const buildPatientTabSWRKey = (tab: keyof PatientTabDataMap, userId?: string) =>
    ['patient-tab', tab, userId ?? null] as const

/**
 * Invalidates a tab's cached data so it re-fetches on the next render.
 * Call this after any mutation that changes the given tab's data,
 * e.g. `invalidatePatientTabData('vitals')` after saving a new reading.
 * Pass `userId` when invalidating a specific (non-self) patient's tab cache.
 */
export function invalidatePatientTabData(tab: keyof PatientTabDataMap, userId?: string) {
    return mutate(buildPatientTabSWRKey(tab, userId))
}

/**
 * Lazily fetches tab-specific patient data using SWR.
 *
 * - First visit to a tab triggers one server action call.
 * - Subsequent visits are instant (SWR cache).
 * - SWR handles deduplication — rapid tab switching never fires duplicate requests.
 * - Pass `{ suspense: true }` to integrate with React Suspense boundaries.
 * - Pass `{ userId }` (Clerk userId) to load a specific patient's data instead
 *   of the authenticated user's own data. The userId is included in the SWR
 *   cache key so each patient's tabs are cached independently.
 */
export function usePatientTab<T extends keyof PatientTabDataMap>(
    tab: T,
    options?: { suspense?: boolean; userId?: string },
) {
    const userId = options?.userId
    return useSWR(
        buildPatientTabSWRKey(tab, userId),
        ([, t, uid]: readonly [string, keyof PatientTabDataMap, string | null]) =>
            (TAB_DATA_FETCHERS[t] as (userId?: string) => Promise<PatientTabDataMap[T] | null>)(uid ?? undefined),
        {
            // Keep data for the session lifetime; mutations use invalidatePatientTabData().
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            suspense: options?.suspense ?? false,
        },
    )
}
