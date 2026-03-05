import useSWR, { mutate } from 'swr'
import {
    getPatientOverviewData,
    getPatientMedicalData,
    getPatientVitalsData,
    getPatientExamsData,
    getPatientObGynData,
    getPatientPediatricData,
    getPatientAddressesData,
    getPatientContactsData,
    getPatientLifestyleData,
    getPatientAllergiesData,
    getPatientVaccinationsData,
    getPatientDisabilitiesData,
    getPatientInsuranceData,
} from '@/actions/patient-profile/get-patient-tab-data'
import type { PatientTabDataMap } from '@/types/patient-profile-tabs'

/** Maps each tab id to its dedicated single-purpose data fetcher. */
const TAB_DATA_FETCHERS: { [K in keyof PatientTabDataMap]: () => Promise<PatientTabDataMap[K] | null> } = {
    overview: getPatientOverviewData,
    medical: getPatientMedicalData,
    vitals: getPatientVitalsData,
    exams: getPatientExamsData,
    obgyn: getPatientObGynData,
    pediatric: getPatientPediatricData,
    addresses: getPatientAddressesData,
    contacts: getPatientContactsData,
    lifestyle: getPatientLifestyleData,
    allergies: getPatientAllergiesData,
    vaccinations: getPatientVaccinationsData,
    disabilities: getPatientDisabilitiesData,
    insurance: getPatientInsuranceData,
}

/**
 * Builds the SWR cache key for a patient profile tab.
 *
 * Export this constant builder to invalidate a tab's data from anywhere:
 *   import { buildPatientTabSWRKey } from '@/hooks/use-patient-tab'
 *   mutate(buildPatientTabSWRKey('vitals'))  // after saving new vitals
 */
export const buildPatientTabSWRKey = (tab: keyof PatientTabDataMap) =>
    ['patient-tab', tab] as const

/**
 * Invalidates a tab's cached data so it re-fetches on the next render.
 * Call this after any mutation that changes the given tab's data,
 * e.g. `invalidatePatientTabData('vitals')` after saving a new reading.
 */
export function invalidatePatientTabData(tab: keyof PatientTabDataMap) {
    return mutate(buildPatientTabSWRKey(tab))
}

/**
 * Lazily fetches tab-specific patient data using SWR.
 *
 * - First visit to a tab triggers one server action call.
 * - Subsequent visits are instant (SWR cache).
 * - SWR handles deduplication — rapid tab switching never fires duplicate requests.
 * - Pass `{ suspense: true }` to integrate with React Suspense boundaries.
 */
export function usePatientTab<T extends keyof PatientTabDataMap>(
    tab: T,
    options?: { suspense?: boolean },
) {
    return useSWR(
        buildPatientTabSWRKey(tab),
        ([, t]) => (TAB_DATA_FETCHERS[t] as () => Promise<PatientTabDataMap[T] | null>)(),
        {
            // Keep data for the session lifetime; mutations use invalidatePatientTabData().
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            suspense: options?.suspense ?? false,
        },
    )
}
