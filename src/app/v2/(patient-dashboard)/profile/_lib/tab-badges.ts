import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

export interface TabBadge {
    status: string
    count: number
}

export function getTabBadge(tabId: string, patient: SerializedPatientHealthRecordsResponse): TabBadge | null {
    switch (tabId) {
        case 'overview': {
            let count = 0
            if (!patient.email) count++
            if (!patient.mobile && !patient.telephone) count++
            if (!patient.dob) count++
            if (!patient.gender) count++
            if (!patient.bloodType) count++
            if (!patient.nationality) count++
            return count > 0 ? { status: 'Incomplete', count } : null
        }
        case 'medical': {
            const count = (patient.medicalHistories.length === 0 ? 1 : 0) + (patient.familyMedicalHistories.length === 0 ? 1 : 0)
            return count > 0 ? { status: 'Incomplete', count } : null
        }
        case 'vitals':
            return patient.vitalSigns.length === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'exams':
            return patient.physicalExaminations.length === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'lifestyle':
            return !patient.personalHistory ? { status: 'Incomplete', count: 1 } : null
        case 'obgyn':
            return !patient.obGyneHistory ? { status: 'Incomplete', count: 1 } : null
        case 'pediatric':
            return patient.pediatricMeasurements.length === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'vaccinations':
            return patient.userVaccinations.length === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'addresses':
            return patient.userAddresses.length === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'contacts':
            return patient.userEmergencyContacts.length === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'insurance': {
            if (patient.philHealthRecords.length === 0) return { status: 'Incomplete', count: 1 }
            const optionalCount =
                (patient.medicalCertificates?.length ?? 0) +
                (patient.referralSlips?.length ?? 0) +
                (patient.procedureHistory?.length ?? 0)
            return optionalCount > 0 ? { status: 'Available', count: optionalCount } : null
        }
        case 'allergies':
        case 'disabilities':
        default:
            return null
    }
}
