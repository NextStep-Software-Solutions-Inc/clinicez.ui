import type {
  MedicalHistory,
  FamilyMedicalHistory,
  VitalSign,
  PhysicalExamination,
  ObGyneHistory,
  PediatricMeasurement,
  PersonalHistory,
  PhilHealthRecord,
  ProcedureUsageHistory,
  ClinicMedicalCertificate,
  ClinicReferralSlip,
  HealthCondition,
  Clinic,
  User,
} from '@prisma/client'

export interface MedicalHistoryData {
  id: number
  conditionId: number
  condition: string
  details: string | null
}

export interface PhysicalExaminationData extends PhysicalExamination {}

export interface ClinicInfo {
  id: number
  name: string
}

export interface CertificateData {
  id: number
  serialNumber: string
  transactionNumber: string | null
  createdAt: Date
  clinic: string | undefined
  createdBy: string
}

export interface ReferralData {
  id: number
  serialNumber: string
  transactionNumber: string | null
  referredTo: string | null
  reason: string | null
  createdAt: Date
  clinic: string | undefined
  createdBy: string
}

export interface PatientHealthRecordsResponse {
  // Demographics
  id: number
  userId: string
  firstName: string | null
  lastName: string | null
  middleName: string | null
  fullName: string
  picture: string | null
  email: string
  mobile: string | null
  telephone: string | null
  dob: Date | null
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
  createdAt: Date
  updatedAt: Date
  clinic: ClinicInfo | null
  
  // Medical Profile
  medicalHistories: MedicalHistoryData[]
  familyMedicalHistories: MedicalHistoryData[]
  
  // Vital Signs
  vitalSigns: VitalSign[]
  latestVitals: VitalSign | null
  
  // Physical Examinations
  physicalExaminations: PhysicalExaminationData[]
  
  // OB/Gyn History
  obGyneHistory: ObGyneHistory | null
  
  // Pediatric Measurements
  pediatricMeasurements: PediatricMeasurement[]
  
  // Personal History & Lifestyle
  personalHistory: PersonalHistory | null
  
  // Insurance & PhilHealth
  philHealthRecords: PhilHealthRecord[]
  
  // Procedure History
  procedureHistory: ProcedureUsageHistory[]
  
  // Clinical Documents
  medicalCertificates: CertificateData[]
  referralSlips: ReferralData[]
}
