import { getPatientHealthRecords } from '@/actions/patient-profile/get-patient-health-records'
import { EditProfileClient } from './edit-profile-client'

/**
 * Edit Profile Page - Server Component
 * 
 * Handles:
 * - Server-side data fetching from getPatientHealthRecords
 * - Initial data load before rendering the client component
 * - Error handling and loading states
 * 
 * Delegates to EditProfileClient for:
 * - Interactive features (navigation, state, mutations)
 * - Client-side hooks and event handlers
 * - Form field updates and section scrolling
 */
export default async function EditProfilePage() {
  try {
    // Fetch patient data server-side
    const patientData = await getPatientHealthRecords()

    if (!patientData) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">Unable to load profile data.</p>
          </div>
        </div>
      )
    }

    // Pass fetched data to client component for interactivity
    return <EditProfileClient initialData={patientData} />
  } catch (error) {
    console.error('Error loading profile:', error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/20 via-blue-50/20 to-slate-100 dark:from-slate-950/20 dark:via-blue-950/20 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4">
            <p className="text-red-800 dark:text-red-200">Failed to load profile data. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }
}
