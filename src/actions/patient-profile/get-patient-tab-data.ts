'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import type {
    OverviewTabData,
    MedicalTabData,
    VitalsTabData,
    ExamsTabData,
    ObGynTabData,
    PediatricTabData,
    AddressesTabData,
    ContactsTabData,
    LifestyleTabData,
    AllergiesTabData,
    VaccinationsTabData,
    DisabilitiesTabData,
    InsuranceTabData,
} from '@/types/patient-profile-tabs'

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Serialises Prisma timestamp fields (createdAt, updatedAt, deletedAt)
 * to ISO strings so the data can cross the server/client boundary.
 */
function serializeDateFields<
    T extends { createdAt: Date; updatedAt: Date; deletedAt?: Date | null },
>(
    record: T,
): Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    createdAt: string
    updatedAt: string
    deletedAt: string | null
} {
    return {
        ...record,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        deletedAt: record.deletedAt?.toISOString() ?? null,
    }
}

/**
 * Resolves internal numeric patient id.
 * When `userId` (Clerk id) is provided it is used directly;
 * otherwise falls back to the currently authenticated user.
 */
async function resolvePatientId(userId?: string): Promise<number | null> {
    const uid = userId ?? (await currentUser())?.id
    if (!uid) return null
    const record = await prisma.user.findUnique({
        where: { userId: uid },
        select: { id: true },
    })
    return record?.id ?? null
}

// ---------------------------------------------------------------------------
// Individual tab data fetchers — each fetches data for exactly one tab
// ---------------------------------------------------------------------------

/** Fetches demographics + latest vitals + stat counts for the Overview tab. */
export async function getPatientOverviewData(userId?: string): Promise<OverviewTabData | null> {
    try {
        const uid = userId ?? (await currentUser())?.id
        if (!uid) return null

        const patient = await prisma.user.findUnique({
            where: { userId: uid },
            select: {
                id: true,
                email: true,
                mobile: true,
                telephone: true,
                dob: true,
                gender: true,
                suffix: true,
                nickname: true,
                nationality: true,
                religion: true,
                civilStatus: true,
            },
        })
        if (!patient) return null

        const [latestVital, medicalCount, vitalsCount, clinicPatient] = await Promise.all([
            prisma.vitalSign.findFirst({
                where: { userId: patient.id, isActive: true, deletedAt: null },
                orderBy: { dateTaken: 'desc' },
            }),
            prisma.medicalHistory.count({ where: { userId: patient.id } }),
            prisma.vitalSign.count({ where: { userId: patient.id, isActive: true, deletedAt: null } }),
            prisma.clinicPatient.findFirst({
                where: { patientId: patient.id, isActive: true, deletedAt: null },
                select: {
                    _count: {
                        select: {
                            MedicalCertificates: { where: { isActive: true } },
                            ClinicReferralSlips: { where: { isActive: true } },
                        },
                    },
                },
            }),
        ])

        return {
            email: patient.email ?? '',
            mobile: patient.mobile,
            telephone: patient.telephone,
            dob: patient.dob?.toISOString() ?? null,
            gender: patient.gender as string | null,
            suffix: patient.suffix,
            nickname: patient.nickname,
            nationality: patient.nationality,
            religion: patient.religion,
            civilStatus: patient.civilStatus,
            medicalHistoriesCount: medicalCount,
            vitalSignsCount: vitalsCount,
            medicalCertificatesCount: clinicPatient?._count.MedicalCertificates ?? 0,
            referralSlipsCount: clinicPatient?._count.ClinicReferralSlips ?? 0,
            latestVitals: latestVital
                ? { ...serializeDateFields(latestVital), dateTaken: latestVital.dateTaken.toISOString() }
                : null,
        }
    } catch (error) {
        console.error('[GET_PATIENT_OVERVIEW_DATA]', error)
        return null
    }
}

/** Fetches medical histories, family histories, and surgical histories for the Medical tab. */
export async function getPatientMedicalData(userId?: string): Promise<MedicalTabData | null> {
    try {
        const patientId = await resolvePatientId(userId)
        if (!patientId) return null

        const [medical, familyMedical, surgical] = await Promise.all([
            prisma.medicalHistory.findMany({
                where: { userId: patientId },
                include: { Condition: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prisma.familyMedicalHistory.findMany({
                where: { userId: patientId, deletedAt: null },
                include: { Condition: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prisma.surgicalHistory.findMany({
                where: { userId: patientId, deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
        ])

        return {
            medicalHistories: medical.map(h => ({ id: h.id, conditionId: h.conditionId, condition: h.Condition?.name ?? 'Unknown', details: h.details })),
            familyMedicalHistories: familyMedical.map(h => ({ id: h.id, conditionId: h.conditionId, condition: h.Condition?.name ?? 'Unknown', details: h.details })),
            surgicalHistories: surgical.map(s => ({
                id: s.id,
                operationName: s.operationName,
                operationDate: s.operationDate?.toISOString() ?? null,
                notes: s.notes,
                createdAt: s.createdAt.toISOString(),
                updatedAt: s.updatedAt.toISOString(),
                deletedAt: s.deletedAt?.toISOString() ?? null,
            })),
        }
    } catch (error) {
        console.error('[GET_PATIENT_MEDICAL_DATA]', error)
        return null
    }
}

/** Fetches vital sign records and gender for the Vitals tab. */
export async function getPatientVitalsData(userId?: string): Promise<VitalsTabData | null> {
    try {
        const uid = userId ?? (await currentUser())?.id
        if (!uid) return null

        const patient = await prisma.user.findUnique({
            where: { userId: uid },
            select: { id: true, gender: true },
        })
        if (!patient) return null

        const vitals = await prisma.vitalSign.findMany({
            where: { userId: patient.id, isActive: true, deletedAt: null },
            orderBy: { dateTaken: 'desc' },
            take: 20,
        })

        return {
            gender: patient.gender as string | null,
            vitalSigns: vitals.map(v => ({
                ...serializeDateFields(v),
                dateTaken: v.dateTaken.toISOString(),
            })),
        }
    } catch (error) {
        console.error('[GET_PATIENT_VITALS_DATA]', error)
        return null
    }
}

/** Fetches visual acuity data from VitalSign records for the Exams tab. */
export async function getPatientExamsData(userId?: string): Promise<ExamsTabData | null> {
    try {
        const patientId = await resolvePatientId(userId)
        if (!patientId) return null

        const vitals = await prisma.vitalSign.findMany({
            where: { userId: patientId, isActive: true, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 20,
        })

        return {
            vitalSigns: vitals.map(v => ({
                ...serializeDateFields(v),
                dateTaken: v.dateTaken.toISOString(),
            })),
        }
    } catch (error) {
        console.error('[GET_PATIENT_EXAMS_DATA]', error)
        return null
    }
}

/** Fetches OB/GYN history and gender for the OB/GYN tab. */
export async function getPatientObGynData(userId?: string): Promise<ObGynTabData | null> {
    try {
        const uid = userId ?? (await currentUser())?.id
        if (!uid) return null

        const patient = await prisma.user.findUnique({
            where: { userId: uid },
            select: { id: true, gender: true },
        })
        if (!patient) return null

        const obGyne = await prisma.obGyneHistory.findFirst({ where: { userId: patient.id } })

        return {
            gender: patient.gender as string | null,
            obGyneHistory: obGyne ? serializeDateFields(obGyne) : null,
        }
    } catch (error) {
        console.error('[GET_PATIENT_OBGYN_DATA]', error)
        return null
    }
}

/** Fetches pediatric growth measurements, DOB, and gender for the Pediatric tab. */
export async function getPatientPediatricData(userId?: string): Promise<PediatricTabData | null> {
    try {
        const uid = userId ?? (await currentUser())?.id
        if (!uid) return null

        const patient = await prisma.user.findUnique({
            where: { userId: uid },
            select: { id: true, dob: true, gender: true },
        })
        if (!patient) return null

        const measurements = await prisma.vitalSign.findMany({
            where: {
                userId: patient.id,
                isActive: true,
                deletedAt: null,
                OR: [
                    { length: { not: null } },
                    { headCircumference: { not: null } },
                    { skinfoldThickness: { not: null } },
                    { waistCircumference: { not: null } },
                    { hipCircumference: { not: null } },
                    { limbCircumference: { not: null } },
                    { midUpperArmCircumference: { not: null } },
                ],
            },
            orderBy: { dateTaken: 'asc' },
            take: 100,
        })

        return {
            dob: patient.dob?.toISOString() ?? null,
            gender: patient.gender as string | null,
            pediatricMeasurements: measurements.map(m => ({
                id: m.id,
                userId: m.userId,
                dateTaken: m.dateTaken.toISOString(),
                length: m.length !== null ? Number(m.length) : null,
                headCircumference: m.headCircumference !== null ? Number(m.headCircumference) : null,
                skinfoldThickness: m.skinfoldThickness !== null ? Number(m.skinfoldThickness) : null,
                waistCircumference: m.waistCircumference !== null ? Number(m.waistCircumference) : null,
                hipCircumference: m.hipCircumference !== null ? Number(m.hipCircumference) : null,
                limbCircumference: m.limbCircumference !== null ? Number(m.limbCircumference) : null,
                midUpperArmCircumference: m.midUpperArmCircumference !== null ? Number(m.midUpperArmCircumference) : null,
                notes: m.notes,
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
                deletedAt: m.deletedAt?.toISOString() ?? null,
            })),
        }
    } catch (error) {
        console.error('[GET_PATIENT_PEDIATRIC_DATA]', error)
        return null
    }
}

/** Fetches home and mailing addresses for the Addresses tab. */
export async function getPatientAddressesData(userId?: string): Promise<AddressesTabData | null> {
    try {
        const patientId = await resolvePatientId(userId)
        if (!patientId) return null

        const addresses = await prisma.userAddress.findMany({
            where: { userId: patientId, isActive: true },
            orderBy: { createdAt: 'desc' },
        })

        return {
            userAddresses: addresses.map(a => ({
                id: a.id,
                address: a.address,
                apartmentUnit: a.apartmentUnit,
                bldgName: a.bldgName,
                addressLine: a.addressLine,
                street: a.street,
                subdivision: a.subdivision,
                region: a.region,
                barangay: a.barangay,
                city: a.city,
                state: a.state,
                zipCode: a.zipCode,
                country: a.country,
                isPrimary: a.isPrimary,
            })),
        }
    } catch (error) {
        console.error('[GET_PATIENT_ADDRESSES_DATA]', error)
        return null
    }
}

/** Fetches emergency contacts for the Contacts tab. */
export async function getPatientContactsData(userId?: string): Promise<ContactsTabData | null> {
    try {
        const patientId = await resolvePatientId(userId)
        if (!patientId) return null

        const contacts = await prisma.userEmergencyContact.findMany({
            where: { userId: patientId, isActive: true },
            orderBy: { createdAt: 'desc' },
        })

        return {
            userEmergencyContacts: contacts.map(c => ({
                id: c.id,
                name: `${c.firstName} ${c.lastName ?? ''}`.trim(),
                firstName: c.firstName,
                lastName: c.lastName ?? '',
                middleName: c.middleName,
                suffix: c.suffix,
                relationship: c.relationship,
                phone: c.phone,
                isPrimary: c.isPrimary,
                address: c.address,
            })),
        }
    } catch (error) {
        console.error('[GET_PATIENT_CONTACTS_DATA]', error)
        return null
    }
}

/** Fetches personal/lifestyle history for the Lifestyle tab. */
export async function getPatientLifestyleData(userId?: string): Promise<LifestyleTabData | null> {
    try {
        const patientId = await resolvePatientId(userId)
        if (!patientId) return null

        const personalHistory = await prisma.personalHistory.findFirst({ where: { userId: patientId } })

        return {
            personalHistory: personalHistory ? serializeDateFields(personalHistory) : null,
        }
    } catch (error) {
        console.error('[GET_PATIENT_LIFESTYLE_DATA]', error)
        return null
    }
}

/** Fetches allergen records for the Allergies tab. */
export async function getPatientAllergiesData(userId?: string): Promise<AllergiesTabData | null> {
    try {
        const patientId = await resolvePatientId(userId)
        if (!patientId) return null

        const allergies = await prisma.userAllergy.findMany({
            where: { userId: patientId },
            select: { id: true, reaction: true, notes: true, Allergen: { select: { name: true } } },
        })

        return {
            userAllergies: allergies.map(a => ({
                id: a.id,
                allergen: a.Allergen.name,
                reaction: a.reaction,
                notes: a.notes,
            })),
        }
    } catch (error) {
        console.error('[GET_PATIENT_ALLERGIES_DATA]', error)
        return null
    }
}

/** Fetches vaccination records for the Vaccinations tab. */
export async function getPatientVaccinationsData(userId?: string): Promise<VaccinationsTabData | null> {
    try {
        const patientId = await resolvePatientId(userId)
        if (!patientId) return null

        const vaccinations = await prisma.userVaccination.findMany({
            where: { userId: patientId, isActive: true, deletedAt: null },
            include: {
                Vaccine: { select: { name: true } },
                Dose: { select: { dose: true } },
                Route: { select: { route: true } },
            },
            orderBy: { dateGiven: 'desc' },
            take: 50,
        })

        return {
            userVaccinations: vaccinations.map(v => ({
                id: v.id,
                vaccine: v.Vaccine.name,
                dose: v.Dose.dose,
                route: v.Route.route,
                dateGiven: v.dateGiven.toISOString(),
                notes: v.notes,
                administeredBy: v.administeredBy,
            })),
        }
    } catch (error) {
        console.error('[GET_PATIENT_VACCINATIONS_DATA]', error)
        return null
    }
}

/** Fetches disability and chronic illness records for the Disabilities tab. */
export async function getPatientDisabilitiesData(userId?: string): Promise<DisabilitiesTabData | null> {
    try {
        const patientId = await resolvePatientId(userId)
        if (!patientId) return null

        const disabilities = await prisma.userDisability.findMany({
            where: { userId: patientId },
            include: {
                Disability: { select: { name: true } },
                DiagnosedBy: { select: { firstName: true, lastName: true } },
            },
            orderBy: { dateDiagnosed: 'desc' },
            take: 20,
        })

        return {
            userDisabilities: disabilities.map(d => ({
                id: d.id,
                disability: d.Disability.name,
                dateDiagnosed: d.dateDiagnosed?.toISOString() ?? null,
                severity: d.severity as string,
                notes: d.notes,
                isManaged: d.isManaged,
                reason: d.reason,
                diagnosedBy: d.DiagnosedBy ? `${d.DiagnosedBy.firstName} ${d.DiagnosedBy.lastName}` : null,
            })),
        }
    } catch (error) {
        console.error('[GET_PATIENT_DISABILITIES_DATA]', error)
        return null
    }
}

/** Fetches PhilHealth records, certificates, referrals, and procedures for the Insurance tab. */
export async function getPatientInsuranceData(userId?: string): Promise<InsuranceTabData | null> {
    try {
        const patientId = await resolvePatientId(userId)
        if (!patientId) return null

        const clinicPatient = await prisma.clinicPatient.findFirst({
            where: { patientId, isActive: true, deletedAt: null },
            select: { id: true, clinicId: true },
        })

        const [philHealth, procedures, certs, slips] = await Promise.all([
            prisma.philHealthRecord.findMany({
                  where: { userId: patientId, isActive: true },
                  include: { PhilHealthDependents: true },
                  orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            prisma.procedureUsageHistory.findMany({
                where: { userId: patientId },
                select: { id: true, userId: true, clinicId: true, procedureType: true, procedureName: true, usedAt: true },
                orderBy: { usedAt: 'desc' },
                take: 20,
            }),
            clinicPatient
                ? prisma.clinicMedicalCertificate.findMany({
                    where: { clinicId: clinicPatient.clinicId, isActive: true, clinicPatientId: clinicPatient.id },
                    include: { Clinic: { select: { name: true } }, CreatedBy: { select: { firstName: true, lastName: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                })
                : Promise.resolve([]),
            clinicPatient
                ? prisma.clinicReferralSlip.findMany({
                    where: { clinicId: clinicPatient.clinicId, isActive: true, clinicPatientId: clinicPatient.id },
                    include: { Clinic: { select: { name: true } }, CreatedBy: { select: { firstName: true, lastName: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                })
                : Promise.resolve([]),
        ])

          return {
              philHealthRecords: philHealth.map(r => ({
                  ...serializeDateFields(r),
                  PhilHealthDependents: r.PhilHealthDependents,
              })),
            medicalCertificates: certs.map(c => ({
                id: c.id,
                serialNumber: c.serialNumber,
                transactionNumber: c.transactionNumber,
                createdAt: c.createdAt.toISOString(),
                clinic: c.Clinic?.name,
                createdBy: c.CreatedBy ? `${c.CreatedBy.firstName} ${c.CreatedBy.lastName}` : 'Unknown',
            })),
            referralSlips: slips.map(s => ({
                id: s.id,
                serialNumber: s.serialNumber,
                transactionNumber: s.transactionNumber,
                referredTo: s.referredTo,
                reason: s.reason,
                createdAt: s.createdAt.toISOString(),
                clinic: s.Clinic?.name,
                createdBy: s.CreatedBy ? `${s.CreatedBy.firstName} ${s.CreatedBy.lastName}` : 'Unknown',
            })),
            procedureHistory: procedures.map(p => ({
                id: p.id,
                userId: p.userId,
                clinicId: p.clinicId,
                procedureType: p.procedureType,
                procedureName: p.procedureName,
                usedAt: p.usedAt.toISOString(),
            })),
        }
    } catch (error) {
        console.error('[GET_PATIENT_INSURANCE_DATA]', error)
        return null
    }
}
