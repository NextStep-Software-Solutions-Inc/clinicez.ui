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
    dob: z.string().nullable(),
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
 * Converts ISO string dates back to Date objects for form validation
 */
export function mapVitalSignToFormInput(
    latestVitals: PatientHealthRecordsResponse['latestVitals'] | null | undefined
) {
    if (!latestVitals) return undefined

    return {
        id: latestVitals.id,
        dateTaken: new Date(latestVitals.dateTaken),
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
 * Converts ISO string dates back to Date objects for form validation
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
        // Convert ISO string dob back to Date object for form schema
        return {
            ...validated,
            dob: validated.dob ? new Date(validated.dob) : null,
        } as DemographicsFormInput
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
 * Converts ISO string dateTaken back to Date object for form validation
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

    // Convert Decimal values to numbers
    const toNumber = (val: any): number | null => {
        if (val === null || val === undefined) return null
        return typeof val === 'number' ? val : Number(val)
    }

    return {
        dateTaken: new Date(latestMeasurement.dateTaken),
        length: toNumber(latestMeasurement.length),
        headCircumference: toNumber(latestMeasurement.headCircumference),
        skinfoldThickness: toNumber(latestMeasurement.skinfoldThickness),
        waistCircumference: toNumber(latestMeasurement.waistCircumference),
        hipCircumference: toNumber(latestMeasurement.hipCircumference),
        limbCircumference: toNumber(latestMeasurement.limbCircumference),
        midUpperArmCircumference: toNumber(latestMeasurement.midUpperArmCircumference),
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

/**
 * Helper: Convert serialized vitalSigns (string dates) to Prisma VitalSign format (Date objects)
 * Used when passing vitals to components that expect Prisma types
 */
export function convertVitalSignsToDateObjects(
    vitalSigns: PatientHealthRecordsResponse['vitalSigns'] | undefined | null
): any[] {
    if (!vitalSigns || vitalSigns.length === 0) return []

    return vitalSigns.map(v => ({
        id: v.id,
        userId: v.userId,
        dateTaken: new Date(v.dateTaken),
        height: v.height,
        weight: v.weight,
        bmi: v.bmi,
        bpSystolic: v.bpSystolic,
        bpDiastolic: v.bpDiastolic,
        pulseRate: v.pulseRate,
        temp: v.temp,
        spo2: v.spo2,
        respRate: v.respRate,
        notes: v.notes,
        createdAt: new Date(v.createdAt),
        updatedAt: new Date(v.updatedAt),
        deletedAt: v.deletedAt ? new Date(v.deletedAt) : null,
        isActive: v.isActive,
    }))
}

/**
 * Helper: Convert serialized pediatricMeasurements (string dates) to Prisma PediatricMeasurement format (Date objects)
 * Used when passing measurements to components that expect Prisma types
 */
export function convertPediatricMeasurementsToDateObjects(
    measurements: PatientHealthRecordsResponse['pediatricMeasurements'] | undefined | null
): any[] {
    if (!measurements || measurements.length === 0) return []

    return measurements.map(m => ({
        id: m.id,
        userId: m.userId,
        dateTaken: new Date(m.dateTaken),
        length: m.length,
        headCircumference: m.headCircumference,
        skinfoldThickness: m.skinfoldThickness,
        waistCircumference: m.waistCircumference,
        hipCircumference: m.hipCircumference,
        limbCircumference: m.limbCircumference,
        midUpperArmCircumference: m.midUpperArmCircumference,
        remarks: m.remarks,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
        deletedAt: m.deletedAt ? new Date(m.deletedAt) : null,
    }))
}
