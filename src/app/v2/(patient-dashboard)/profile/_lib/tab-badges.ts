import type { PatientBadgeCounts } from '@/types/patient-profile-tabs'

export interface TabBadge {
    status: string
    count: number
}

export function getTabBadge(tabId: string, badges: PatientBadgeCounts): TabBadge | null {
    switch (tabId) {
        case 'overview': {
            let count = 0
            if (!badges.hasEmail) count++
            if (!badges.hasMobile) count++
            if (!badges.hasDob) count++
            if (!badges.hasGender) count++
            if (!badges.hasBloodType) count++
            if (!badges.hasNationality) count++
            return count > 0 ? { status: 'Incomplete', count } : null
        }
        case 'medical': {
            const count = (badges.medicalHistoriesCount === 0 ? 1 : 0) + (badges.familyMedicalHistoriesCount === 0 ? 1 : 0)
            return count > 0 ? { status: 'Incomplete', count } : null
        }
        case 'vitals':
            return badges.vitalSignsCount === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'exams':
            return badges.physicalExaminationsCount === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'lifestyle':
            return !badges.hasPersonalHistory ? { status: 'Incomplete', count: 1 } : null
        case 'obgyn':
            return !badges.hasObGyneHistory ? { status: 'Incomplete', count: 1 } : null
        case 'pediatric':
            return badges.pediatricMeasurementsCount === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'vaccinations':
            return badges.userVaccinationsCount === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'addresses':
            return badges.userAddressesCount === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'contacts':
            return badges.userEmergencyContactsCount === 0 ? { status: 'Incomplete', count: 1 } : null
        case 'insurance': {
            if (badges.philHealthRecordsCount === 0) return { status: 'Incomplete', count: 1 }
            return badges.totalDocumentsCount > 0 ? { status: 'Available', count: badges.totalDocumentsCount } : null
        }
        case 'allergies':
        case 'disabilities':
        default:
            return null
    }
}
