/**
 * Health Records Components
 * Reusable form components for patient health record editing
 */

// Reusable form components
export { FormModal, type FormModalProps } from './form-modal'
export { FormField, type FormFieldProps } from './form-field'
export { EditButton, type EditButtonProps } from './edit-button'
export { ErrorDisplay, type ErrorDisplayProps, type ErrorVariant } from './error-display'
export { LoadingState, type LoadingStateProps } from './loading-state'

// Form implementations
export { DemographicsEditForm, type DemographicsEditFormProps } from './demographics-edit-form'
export { VitalSignEditForm, type VitalSignEditFormProps } from './vital-sign-edit-form'
export { PersonalHistoryEditForm, type PersonalHistoryEditFormProps } from './personal-history-edit-form'
export { ObGyneHistoryEditForm, type ObGyneHistoryEditFormProps } from './ob-gyne-history-edit-form'
export { MedicalConditionsEditForm, type MedicalConditionsEditFormProps } from './medical-conditions-edit-form'
export { FamilyMedicalHistoryEditForm, type FamilyMedicalHistoryEditFormProps } from './family-medical-history-edit-form'
export { SurgicalHistoryEditForm, type SurgicalHistoryEditFormProps } from './surgical-history-edit-form'
export { PhilHealthRecordEditForm, type PhilHealthRecordEditFormProps } from './philhealth-record-edit-form'

export { PhysicalExamEditForm, type PhysicalExamEditFormProps } from './physical-exam-edit-form'
export { PhysicalExamSystemField, type PhysicalExamSystemFieldProps } from './physical-exam-system-field'
export { AllergyEditForm, type AllergyEditFormProps } from './allergy-edit-form'
export { EmergencyContactEditForm, type EmergencyContactEditFormProps } from './emergency-contact-edit-form'
export { AddressEditForm, type AddressEditFormProps } from './address-edit-form'
export { VaccinationEditForm, type VaccinationEditFormProps } from './vaccination-edit-form'
export { DisabilitiesEditForm, type DisabilitiesEditFormProps } from './disabilities-illnesses-edit-form'
export { ProfilePictureUpload, type ProfilePictureUploadProps } from './profile-picture-upload'
export { PhysicalExamListEditor } from './physical-exam-list-editor'
