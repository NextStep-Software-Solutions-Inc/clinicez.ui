/**
 * Health Records Mappers & Validators
 * 
 * Handles converting database responses (generic strings) to form inputs (type-safe enums)
 * Uses Zod for runtime validation at the data boundary
 * 
 * Separation of concerns:
 * - Database layer returns string | null (generic)
 * - This module validates and converts to specific form types
 * - Components receive fully validated, type-safe data
 */

import { z } from 'zod'
import type { PatientHealthRecordsResponse } from '@/types/patient-profile'
import type { PersonalHistoryFormInput, DemographicsFormInput } from '@/schemas'

/**
 * Runtime Zod schemas for validating database responses
 * These represent what the database CAN return
 */

export const PersonalHistoryDbSchema = z.object({
    smokingStatus: z.enum(['NEVER', 'FORMER', 'CURRENT'] as const).nullable(),
    numberOfPacksPerYear: z.number().nullable(),
    alcoholStatus: z.enum(['NEVER', 'OCCASIONAL', 'REGULAR', 'HEAVY'] as const).nullable(),
    numberOfBottlesPerDay: z.number().nullable(),
    illicitDrugUse: z.enum(['NEVER', 'FORMER', 'CURRENT'] as const).nullable(),
    sexuallyActive: z.enum(['YES', 'NO', 'INACTIVE'] as const).nullable(),
})

export const DemographicsDbSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    middleName: z.string().nullable(),
    dob: z.date().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'] as const).nullable(),
    bloodType: z.enum(['O_POSITIVE', 'O_NEGATIVE', 'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'] as const).nullable(),
    civilStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] as const).nullable(),
    religion: z.string().nullable(),
    mobile: z.string().nullable(),
    telephone: z.string().nullable(),
    placeOfBirth: z.string().nullable(),
    nationality: z.string().nullable(),
    suffix: z.string().nullable(),
    nickname: z.string().nullable(),
})

/**
 * Mapper: PersonalHistory response → form input
 * 
 * Validates enum values at data boundary using Zod
 * If database returns invalid enum, throws error (caught & logged)
 * This prevents silent type errors and exposes data integrity issues
 */
export function mapPersonalHistoryToFormInput(
    personalHistory: PatientHealthRecordsResponse['personalHistory'] | null | undefined
): PersonalHistoryFormInput | undefined {
    if (!personalHistory) return undefined

    try {
        // Validate at runtime - catches invalid enum values from database
        const validated = PersonalHistoryDbSchema.parse(personalHistory)
        // Type is now proven safe to form input type
        return validated as PersonalHistoryFormInput
    } catch (error) {
        console.error('Personal history validation error:', error)
        return undefined
    }
}

/**
 * Mapper: Latest VitalSign → form input
 * 
 * Maps the most recent vital sign record to the form input type
 * This prepopulates the form with the user's latest measurements
 */
export function mapVitalSignToFormInput(
    latestVitals: PatientHealthRecordsResponse['latestVitals'] | null | undefined
) {
    if (!latestVitals) return undefined

    return {
        id: latestVitals.id,
        dateTaken: latestVitals.dateTaken,
        height: latestVitals.height,
        weight: latestVitals.weight,
        bpSystolic: latestVitals.bpSystolic,
        bpDiastolic: latestVitals.bpDiastolic,
        pulseRate: latestVitals.pulseRate,
        temp: latestVitals.temp,
        spo2: latestVitals.spo2,
        respRate: latestVitals.respRate,
        notes: latestVitals.notes,
    }
}

/**
 * Mapper: PatientHealthRecords → Demographics form input
 * 
 * Validates enum values at data boundary using Zod
 * If database returns invalid enum, throws error (caught & logged)
 * This prevents silent type errors and exposes data integrity issues
 */
export function mapPatientDataToDemographicsFormInput(
    patientData: PatientHealthRecordsResponse | null | undefined
): DemographicsFormInput | undefined {
    if (!patientData) return undefined

    try {
        // Validate at runtime - catches invalid enum values from database
        const validated = DemographicsDbSchema.parse({
            firstName: patientData.firstName || '',
            lastName: patientData.lastName || '',
            middleName: patientData.middleName,
            dob: patientData.dob,
            gender: patientData.gender,
            bloodType: patientData.bloodType,
            civilStatus: patientData.civilStatus,
            religion: patientData.religion,
            mobile: patientData.mobile,
            telephone: patientData.telephone,
            placeOfBirth: patientData.placeOfBirth,
            nationality: patientData.nationality,
            suffix: patientData.suffix,
            nickname: patientData.nickname,
        })
        // Type is now proven safe to form input type
        return validated as DemographicsFormInput
    } catch (error) {
        console.error('Demographics validation error:', error)
        return undefined
    }
}

/**
 * Mapper: Latest PediatricMeasurement → form input
 * 
 * Maps the most recent pediatric measurement record to the form input type
 * This prepopulates the form with the patient's latest pediatric measurements
 * Schema handles Decimal/number coercion via Zod
 * 
 * Data is already sorted by createdAt DESC in server action, so [0] is the latest
 */
export function mapPediatricMeasurementToFormInput(
    pediatricMeasurements: PatientHealthRecordsResponse['pediatricMeasurements'] | null | undefined
) {
    if (!pediatricMeasurements || pediatricMeasurements.length === 0) return undefined

    // Get the most recent measurement (first in array, already sorted by createdAt DESC)
    const latestMeasurement = pediatricMeasurements[0]
    if (!latestMeasurement) return undefined

    return {
        dateTaken: latestMeasurement.dateTaken,
        length: latestMeasurement.length,
        headCircumference: latestMeasurement.headCircumference,
        skinfoldThickness: latestMeasurement.skinfoldThickness,
        waistCircumference: latestMeasurement.waistCircumference,
        hipCircumference: latestMeasurement.hipCircumference,
        limbCircumference: latestMeasurement.limbCircumference,
        midUpperArmCircumference: latestMeasurement.midUpperArmCircumference,
        remarks: latestMeasurement.remarks,
    }
}

/**
 * Mapper: Latest PhysicalExamination → form input
 * 
 * Maps the most recent physical examination record to the form input type
 * This prepopulates the form with the patient's latest examination findings
 * 
 * Data is already sorted by createdAt DESC in server action, so [0] is the latest
 */
export function mapPhysicalExaminationToFormInput(
    physicalExaminations: PatientHealthRecordsResponse['physicalExaminations'] | null | undefined
) {
    if (!physicalExaminations || physicalExaminations.length === 0) return undefined

    // Get the most recent examination (first in array, already sorted by createdAt DESC)
    const latestExamination = physicalExaminations[0]
    if (!latestExamination) return undefined

    return {
        visualAcuityLeft: latestExamination.visualAcuityLeft,
        visualAcuityRight: latestExamination.visualAcuityRight,
        status: latestExamination.status,
    }
}
