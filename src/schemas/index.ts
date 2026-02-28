/**
 * Central export for all validation schemas
 * Allows: import { demographicsSchema } from '@/schemas'
 */

export * from './demographics-schema'
export * from './vital-signs-schema'
export * from './physical-examination-schema'
export * from './personal-history-schema'
export * from './ob-gyne-history-schema'
export * from './pediatric-measurement-schema'
export * from './medical-history-schema'
export * from './family-medical-history-schema'
export * from './philhealth-record-schema'
export * from './allergy-schema'
export * from './emergency-contact-schema'
export * from './address-schema'

/**
 * Combined type registry for all form inputs
 * Useful for type-safe form handlers
 */
export type AllFormInputs =
  | { type: 'demographics'; data: import('./demographics-schema').DemographicsFormInput }
  | { type: 'vitals'; data: import('./vital-signs-schema').VitalSignFormInput }
  | { type: 'physical-exam'; data: import('./physical-examination-schema').PhysicalExaminationFormInput }
  | { type: 'personal-history'; data: import('./personal-history-schema').PersonalHistoryFormInput }
  | { type: 'ob-gyne'; data: import('./ob-gyne-history-schema').ObGyneHistoryFormInput }
  | { type: 'pediatric'; data: import('./pediatric-measurement-schema').PediatricMeasurementFormInput }
  | { type: 'medical-history'; data: import('./medical-history-schema').MedicalHistoryFormInput }
  | { type: 'family-history'; data: import('./family-medical-history-schema').FamilyMedicalHistoryFormInput }
  | { type: 'philhealth'; data: import('./philhealth-record-schema').PhilHealthRecordFormInput }
