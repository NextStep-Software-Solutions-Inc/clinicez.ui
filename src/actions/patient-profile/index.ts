/**
 * Patient Profile Server Actions
 * Central export point for all patient health record mutations
 */

export {
  updateDemographics,
  type UpdateDemographicsResponse,
} from './update-demographics'

export {
  addVitalSign,
  type AddVitalSignResponse,
} from './add-vital-sign'

export {
  updatePersonalHistory,
  type UpdatePersonalHistoryResponse,
} from './update-personal-history'

export {
  updateObGyneHistory,
  type UpdateObGyneHistoryResponse,
} from './update-ob-gyne-history'

export {
  addPediatricMeasurement,
  type AddPediatricMeasurementResponse,
} from './add-pediatric-measurement'

export {
  updateMedicalConditions,
  type UpdateMedicalConditionsResponse,
} from './update-medical-conditions'

export {
  updateFamilyMedicalConditions,
  type UpdateFamilyMedicalConditionsResponse,
} from './update-family-medical-conditions'

export {
  addPhysicalExamination,
  type AddPhysicalExaminationResponse,
} from './add-physical-examination'

export {
  updatePhilhealthRecord,
  type UpdatePhilhealthRecordResponse,
} from './update-philhealth-record'
