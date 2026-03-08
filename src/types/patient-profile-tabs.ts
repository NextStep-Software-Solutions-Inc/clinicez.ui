/**
 * Slim patient data loaded at SSR time — only what is needed for the profile card
 * and tab badge counts. Full tab data is fetched lazily per-tab via SWR.
 */

import type {
    VitalSign,
    ObGyneHistory,
    PersonalHistory,
    PhilHealthRecord,
    PhilHealthMemberType,
    PhilHealthDependent,
    VerificationStatus,
} from '@prisma/client'
import type {
    MedicalHistoryData,
    PhysicalExaminationData,
    CertificateData,
    ReferralData,
    ClinicInfo,
} from '@/types/patient-profile'

// ---------------------------------------------------------------------------
// Serialised helpers (re-exported for convenience)
// ---------------------------------------------------------------------------
export type SerializedVitalSign = Omit<VitalSign, 'dateTaken' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    dateTaken: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export type SerializedObGyneHistory = Omit<ObGyneHistory, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export type SerializedPersonalHistory = Omit<PersonalHistory, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export type SerializedPhilHealthRecord = Omit<PhilHealthRecord, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    PhilHealthMemberType?: (Omit<PhilHealthMemberType, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string }) | null
    PhilHealthDependents?: PhilHealthDependent[]
}

// ---------------------------------------------------------------------------
// Badge counts — all that's needed by the tab nav without fetching full records
// ---------------------------------------------------------------------------
export interface PatientBadgeCounts {
    hasEmail: boolean
    hasMobile: boolean
    hasDob: boolean
    hasGender: boolean
    hasBloodType: boolean
    hasNationality: boolean
    medicalHistoriesCount: number
    familyMedicalHistoriesCount: number
    vitalSignsCount: number
    physicalExaminationsCount: number
    hasPersonalHistory: boolean
    hasObGyneHistory: boolean
    pediatricMeasurementsCount: number
    userVaccinationsCount: number
    userAddressesCount: number
    userEmergencyContactsCount: number
    philHealthRecordsCount: number
    totalDocumentsCount: number   // certs + referrals + procedures
}

// ---------------------------------------------------------------------------
// PatientBaseData — profile card + badge counts only
// ---------------------------------------------------------------------------
export interface PatientBaseData {
    id: number
    clinicPatientId: number | null
    userId: string
    firstName: string | null
    lastName: string | null
    fullName: string
    picture: string | null
    age: number | null
    gender: string | null
    bloodType: string | null
    caseNumber: string | null
    nickname: string | null
    suffix: string | null
    clinic: ClinicInfo | null
    verificationStatus: VerificationStatus
    badges: PatientBadgeCounts
}

// ---------------------------------------------------------------------------
// Per-tab data types
// ---------------------------------------------------------------------------

export interface OverviewTabData {
    // Demographics for display
    email: string
    mobile: string | null
    telephone: string | null
    dob: string | null
    gender: string | null
    suffix: string | null
    nickname: string | null
    nationality: string | null
    religion: string | null
    civilStatus: string | null
    // Stat counts
    medicalHistoriesCount: number
    vitalSignsCount: number
    medicalCertificatesCount: number
    referralSlipsCount: number
    // Latest reading
    latestVitals: SerializedVitalSign | null
}

export interface MedicalTabData {
    medicalHistories: MedicalHistoryData[]
    familyMedicalHistories: MedicalHistoryData[]
    surgicalHistories: Array<{
        id: number
        operationName: string
        operationDate: string | null
        notes: string | null
        createdAt: string
        updatedAt: string
        deletedAt: string | null
    }>
}

export interface VitalsTabData {
    vitalSigns: SerializedVitalSign[]
    gender: string | null
}

export interface ExamsTabData {
    physicalExaminations: PhysicalExaminationData[]
}

export interface ObGynTabData {
    gender: string | null
    obGyneHistory: SerializedObGyneHistory | null
}

export interface PediatricTabData {
    dob: string | null
    gender: string | null
    pediatricMeasurements: Array<{
        id: number
        userId: number
        dateTaken: string
        length: number | null
        headCircumference: number | null
        skinfoldThickness: number | null
        waistCircumference: number | null
        hipCircumference: number | null
        limbCircumference: number | null
        midUpperArmCircumference: number | null
        remarks: string | null
        createdAt: string
        updatedAt: string
        deletedAt: string | null
    }>
}

export interface AddressesTabData {
    userAddresses: Array<{
        id: number
        address: string
        apartmentUnit: string | null
        bldgName: string | null
        addressLine: string | null
        street: string | null
        subdivision: string | null
        region: string | null
        barangay: string | null
        city: string
        state: string
        zipCode: string
        country: string
        isPrimary: boolean
    }>
}

export interface ContactsTabData {
    userEmergencyContacts: Array<{
        id: number
        name: string
        firstName: string
        lastName: string
        middleName: string | null
        suffix: string | null
        relationship: string
        phone: string
        isPrimary: boolean
        address: string | null
    }>
}

export interface LifestyleTabData {
    personalHistory: SerializedPersonalHistory | null
}

export interface AllergiesTabData {
    userAllergies: Array<{
        id: number
        allergen: string
        reaction: string
        notes: string | null
    }>
}

export interface VaccinationsTabData {
    userVaccinations: Array<{
        id: number
        vaccine: string
        dose: string
        route: string
        dateGiven: string
        notes: string | null
        administeredBy: string | null
    }>
}

export interface DisabilitiesTabData {
    userDisabilities: Array<{
        id: number
        disability: string
        dateDiagnosed: string | null
        severity: string
        notes: string | null
        isManaged: boolean | null
        reason: string | null
        diagnosedBy: string | null
    }>
}

export interface InsuranceTabData {
    philHealthRecords: SerializedPhilHealthRecord[]
    medicalCertificates: CertificateData[]
    referralSlips: ReferralData[]
    procedureHistory: Array<{
        id: number
        userId: number
        clinicId: number
        procedureType: string | null
        procedureName: string | null
        usedAt: string
    }>
}

// ---------------------------------------------------------------------------
// Discriminated map used for typing the server action + SWR hook
// ---------------------------------------------------------------------------
export type PatientTabDataMap = {
    overview: OverviewTabData
    medical: MedicalTabData
    vitals: VitalsTabData
    exams: ExamsTabData
    obgyn: ObGynTabData
    pediatric: PediatricTabData
    addresses: AddressesTabData
    contacts: ContactsTabData
    lifestyle: LifestyleTabData
    allergies: AllergiesTabData
    vaccinations: VaccinationsTabData
    disabilities: DisabilitiesTabData
    insurance: InsuranceTabData
}
