import type {
  MedicalHistory,
  FamilyMedicalHistory,
  VitalSign,
  PhysicalExamination,
  ObGyneHistory,

  PersonalHistory,
  PhilHealthRecord,
  PhilHealthDependent,
  ProcedureUsageHistory,
  ClinicMedicalCertificate,
  ClinicReferralSlip,
  HealthCondition,
  Clinic,
  User,
  VerificationStatus,
} from '@prisma/client'

export interface MedicalHistoryData {
  id: number
  conditionId: number
  condition: string
  details: string | null
}



export interface ClinicInfo {
  id: number
  name: string
}

export interface CertificateData {
  id: number
  serialNumber: string
  transactionNumber: string | null
  createdAt: string  // ISO string
  clinic: string | undefined
  createdBy: string
}

export interface ReferralData {
  id: number
  serialNumber: string
  transactionNumber: string | null
  referredTo: string | null
  reason: string | null
  createdAt: string  // ISO string
  clinic: string | undefined
  createdBy: string
}

export interface SerializedPatientHealthRecordsResponse {
  // Demographics
  id: number
  clinicPatientId?: number
  userId: string
  firstName: string | null
  lastName: string | null
  middleName: string | null
  fullName: string
  picture: string | null
  email: string
  mobile: string | null
  telephone: string | null
  dob: string | null  // ISO string
  age: number | null
  gender: string | null
  bloodType: string | null
  civilStatus: string | null
  placeOfBirth: string | null
  nationality: string | null
  religion: string | null
  suffix: string | null
  nickname: string | null
  caseNumber: string | null
  verificationStatus: VerificationStatus
  createdAt: string  // ISO string
  updatedAt: string  // ISO string
  clinic: ClinicInfo | null

  // Medical Profile
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
  ncdQuestionnaire: { id: number } | null

  vitalSigns: Array<Omit<VitalSign, 'dateTaken' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { dateTaken: string; createdAt: string; updatedAt: string; deletedAt: string | null }>
  latestVitals: (Omit<VitalSign, 'dateTaken' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { dateTaken: string; createdAt: string; updatedAt: string; deletedAt: string | null }) | null

  // Physical Examination
  physicalExaminations: Array<Omit<PhysicalExamination, 'createdAt' | 'updatedAt' | 'deletedAt'> & { createdAt: string; updatedAt: string; deletedAt: string | null }>
  latestPhysicalExam: (Omit<PhysicalExamination, 'createdAt' | 'updatedAt' | 'deletedAt'> & { createdAt: string; updatedAt: string; deletedAt: string | null }) | null



  // OB/Gyn History
  obGyneHistory: (Omit<ObGyneHistory, 'createdAt' | 'updatedAt' | 'deletedAt'> & { createdAt: string; updatedAt: string; deletedAt: string | null }) | null

  // Yakap
  yakapEnlistment?: {
    id: number
    hciCaseNo: string | null
    profilingTransNo: string | null
  }

  // Pediatric Measurements
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
    notes: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
  }>

  // Personal History & Lifestyle
  personalHistory: (Omit<PersonalHistory, 'createdAt' | 'updatedAt' | 'deletedAt'> & { createdAt: string; updatedAt: string; deletedAt: string | null }) | null

  // Allergies
  userAllergies: Array<{
    id: number
    allergen: string
    reaction: string
    notes: string | null
  }>

  // Emergency Contacts
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

  // Vaccinations
  userVaccinations: Array<{
    id: number
    vaccine: string
    dose: string
    route: string
    dateGiven: string
    notes: string | null
    administeredBy: string | null
  }>

  // Disabilities & Illnesses
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

  // Addresses
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

  // Insurance & PhilHealth
  philHealthRecords: Array<Omit<PhilHealthRecord, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    PhilHealthDependents?: PhilHealthDependent[]
  }>

  // Procedure History
  procedureHistory: Array<Omit<ProcedureUsageHistory, 'usedAt'> & { usedAt: string }>

  // Clinical Documents
  medicalCertificates: CertificateData[]
  referralSlips: ReferralData[]
}

// Original type for backwards compatibility
export type PatientHealthRecordsResponse = SerializedPatientHealthRecordsResponse
