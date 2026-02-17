import { getPatientHealthRecords } from '@/actions/patient-profile/get-patient-health-records'
import { EditProfileClient } from './edit-profile-client'

/**
 * Edit Profile Page - Server Component
 *
 * Handles:
 * - Server-side data fetching via getPatientHealthRecords
 * - Initial data load before rendering the client component
 *
 * Loading state is managed by loading.tsx (Next.js App Router pattern).
 * Errors are caught by error.tsx.
 *
 * Delegates to EditProfileClient for:
 * - Interactive features (navigation, state, mutations)
 * - Client-side hooks and event handlers
 */
export default async function EditProfilePage() {
  try {
    // This will show loading.tsx until data is loaded
    const patientData = await getPatientHealthRecords()

    if (!patientData) {
      throw new Error('Unable to load profile data. Please try refreshing the page.')
    }

    return <EditProfileClient initialData={patientData} />
  } catch (error) {
    // Let error.tsx handle this
    throw error
  }
}
