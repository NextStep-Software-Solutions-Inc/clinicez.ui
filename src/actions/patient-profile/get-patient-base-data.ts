'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import type { PatientBaseData } from '@/types/patient-profile-tabs'

/**
 * Fetches only the data needed for the profile card and tab badge counts.
 * This is the only query that runs at SSR time — all tab content is lazy.
 */
export async function getPatientBaseData(): Promise<PatientBaseData | null> {
    try {
        const user = await currentUser()
        if (!user?.id) return null

        const patient = await prisma.user.findUnique({
            where: { userId: user.id },
            select: {
                id: true,
                userId: true,
                firstName: true,
                lastName: true,
                middleName: true,
                picture: true,
                email: true,
                mobile: true,
                telephone: true,
                dob: true,
                gender: true,
                bloodType: true,
                nationality: true,
                suffix: true,
                nickname: true,
                caseNumber: true,
                verificationStatus: true,
                // Count relations in a single query — no full arrays
                _count: {
                    select: {
                        MedicalHistories: true,
                        FamilyMedicalHistories: true,
                        VitalSigns: { where: { isActive: true, deletedAt: null } },
                        PhysicalExaminations: true,
                        PediatricMeasurements: true,
                        UserVaccinations: { where: { isActive: true, deletedAt: null } },
                        UserAddresses: { where: { isActive: true } },
                        UserEmergencyContacts: { where: { isActive: true } },
                        PhilHealthRecords: { where: { isActive: true } },
                    },
                },
                PersonalHistory: { select: { id: true } },
                ObGyneHistory: { select: { id: true } },
                ClinicPatients: {
                    where: { isActive: true, deletedAt: null },
                    select: {
                        id: true,
                        _count: {
                            select: {
                                MedicalCertificates: { where: { isActive: true } },
                                ClinicReferralSlips: { where: { isActive: true } },
                            },
                        },
                        PhilHealthKonsultaEnlistments: {
                            where: {
                                year: new Date().getFullYear(),
                                status: 'ACTIVE'
                            },
                            select: {
                                id: true,
                                hciCaseNo: true,
                                profilingTransNo: true
                            }
                        }
                    },
                    take: 1,
                },

            },
        })

        if (!patient) return null

        const clinicPatient = patient.ClinicPatients[0] ?? null
        const certCount = clinicPatient?._count.MedicalCertificates ?? 0
        const referralCount = clinicPatient?._count.ClinicReferralSlips ?? 0
        const procedureCount = await prisma.procedureUsageHistory.count({ where: { userId: patient.id } })

        return {
            id: patient.id,
            clinicPatientId: clinicPatient?.id ?? null,
            userId: patient.userId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            fullName: `${patient.firstName ?? ''} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName ?? ''}`.trim(),
            picture: patient.picture,
            age: patient.dob
                ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : null,
            gender: patient.gender,
            bloodType: patient.bloodType,
            caseNumber: patient.caseNumber,
            nickname: patient.nickname,
            suffix: patient.suffix,
            verificationStatus: patient.verificationStatus,
            badges: {
                hasEmail: !!patient.email,
                hasMobile: !!(patient.mobile || patient.telephone),
                hasDob: !!patient.dob,
                hasGender: !!patient.gender,
                hasBloodType: !!patient.bloodType,
                hasNationality: !!patient.nationality,
                medicalHistoriesCount: patient._count.MedicalHistories,
                familyMedicalHistoriesCount: patient._count.FamilyMedicalHistories,
                vitalSignsCount: patient._count.VitalSigns,
                physicalExaminationsCount: patient._count.PhysicalExaminations,
                hasPersonalHistory: patient.PersonalHistory !== null,
                hasObGyneHistory: patient.ObGyneHistory !== null,
                pediatricMeasurementsCount: patient._count.PediatricMeasurements,
                userVaccinationsCount: patient._count.UserVaccinations,
                userAddressesCount: patient._count.UserAddresses,
                userEmergencyContactsCount: patient._count.UserEmergencyContacts,
                philHealthRecordsCount: patient._count.PhilHealthRecords,
                totalDocumentsCount: certCount + referralCount + procedureCount,
            },
            yakapEnlistment: clinicPatient?.PhilHealthKonsultaEnlistments?.[0] ? {
                id: clinicPatient.PhilHealthKonsultaEnlistments[0].id,
                hciCaseNo: clinicPatient.PhilHealthKonsultaEnlistments[0].hciCaseNo,
                profilingTransNo: clinicPatient.PhilHealthKonsultaEnlistments[0].profilingTransNo
            } : undefined
        }
    } catch (error) {
        console.error('[GET_PATIENT_BASE_DATA]', error)
        return null
    }
}
