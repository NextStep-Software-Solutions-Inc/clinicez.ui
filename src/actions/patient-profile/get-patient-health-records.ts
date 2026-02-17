'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
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
import type {
  PatientHealthRecordsResponse,
  MedicalHistoryData,
  PhysicalExaminationData,
  ClinicInfo,
  CertificateData,
  ReferralData,
} from '@/types/patient-profile'

export async function getPatientHealthRecords() {
  try {
    let user: any = null
    
    try {
      user = await currentUser()
    } catch (clerkError: any) {
      console.error('[CLERK_ERROR] Failed to get current user:', {
        message: clerkError?.message,
        status: clerkError?.status,
        errors: clerkError?.errors,
      })
      // Return null to show error message instead of crashing
      return null
    }
    
    if (!user?.id) {
      console.error('[GET_PATIENT_HEALTH_RECORDS] No user or user.id', { user })
      return null
    }

    // Get basic patient record first
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
        civilStatus: true,
        placeOfBirth: true,
        nationality: true,
        religion: true,
        suffix: true,
        nickname: true,
        caseNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!patient) {
      return null
    }

    // Fetch related data in separate queries
    const [medical, familyMedical, vitals, exams, obGyne, pediatric, personal, philHealth, procedures, clinicPatients] = await Promise.all([
      // Medical Histories
      prisma.medicalHistory.findMany({
        where: { userId: patient.id },
        include: {
          Condition: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      // Family Medical Histories
      prisma.familyMedicalHistory.findMany({
        where: { userId: patient.id, deletedAt: null },
        include: {
          Condition: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      // Vital Signs
      prisma.vitalSign.findMany({
        where: { userId: patient.id, isActive: true, deletedAt: null },
        orderBy: { dateTaken: 'desc' },
        take: 5,
      }),
      // Physical Examinations
      prisma.physicalExamination.findMany({
        where: { userId: patient.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // OB/Gyn History
      prisma.obGyneHistory.findFirst({
        where: { userId: patient.id },
      }),
      // Pediatric Measurements
      prisma.pediatricMeasurement.findMany({
        where: { userId: patient.id },
        orderBy: { dateTaken: 'asc' },
        take: 100,
      }),
      // Personal History
      prisma.personalHistory.findFirst({
        where: { userId: patient.id },
      }),
      // PhilHealth Records
      prisma.philHealthRecord.findMany({
        where: { userId: patient.id, isActive: true },
        include: {
          PhilHealthDependents: true,
          PhilHealthMemberType: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Procedure History
      prisma.procedureUsageHistory.findMany({
        where: { userId: patient.id },
        orderBy: { usedAt: 'desc' },
        take: 10,
      }),
      // Clinic Patients
      prisma.clinicPatient.findMany({
        where: { patientId: patient.id, isActive: true, deletedAt: null },
        include: {
          Clinic: {
            select: { id: true, name: true },
          },
        },
        take: 1,
      }),
    ])

    // Fetch medical certificates and referral slips from clinic
    const clinicPatient = clinicPatients[0]

    let certificateDataList: CertificateData[] = []
    let referralDataList: ReferralData[] = []

    if (clinicPatient) {
      const certs = await prisma.clinicMedicalCertificate.findMany({
        where: {
          clinicId: clinicPatient.clinicId,
          isActive: true,
          clinicPatientId: clinicPatient.id,
        },
        include: {
          Clinic: {
            select: { id: true, name: true },
          },
          CreatedBy: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const slips = await prisma.clinicReferralSlip.findMany({
        where: {
          clinicId: clinicPatient.clinicId,
          isActive: true,
          clinicPatientId: clinicPatient.id,
        },
        include: {
          Clinic: {
            select: { id: true, name: true },
          },
          CreatedBy: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      certificateDataList = certs.map((cert) => ({
        id: cert.id,
        serialNumber: cert.serialNumber,
        transactionNumber: cert.transactionNumber,
        createdAt: cert.createdAt,
        clinic: cert.Clinic?.name,
        createdBy: cert.CreatedBy ? `${cert.CreatedBy.firstName} ${cert.CreatedBy.lastName}` : 'Unknown',
      }))

      referralDataList = slips.map((slip) => ({
        id: slip.id,
        serialNumber: slip.serialNumber,
        transactionNumber: slip.transactionNumber,
        referredTo: slip.referredTo,
        reason: slip.reason,
        createdAt: slip.createdAt,
        clinic: slip.Clinic?.name,
        createdBy: slip.CreatedBy ? `${slip.CreatedBy.firstName} ${slip.CreatedBy.lastName}` : 'Unknown',
      }))
    }

    return {
      // Demographics
      id: patient.id,
      userId: patient.userId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      fullName: `${patient.firstName || ''} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName || ''}`.trim(),
      picture: patient.picture,
      email: patient.email,
      mobile: patient.mobile,
      telephone: patient.telephone,
      dob: patient.dob,
      age: patient.dob ? Math.floor((new Date().getTime() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
      gender: patient.gender,
      bloodType: patient.bloodType,
      civilStatus: patient.civilStatus,
      placeOfBirth: patient.placeOfBirth,
      nationality: patient.nationality,
      religion: patient.religion,
      suffix: patient.suffix,
      nickname: patient.nickname,
      caseNumber: patient.caseNumber,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      clinic: clinicPatients[0]?.Clinic || null,

      // Medical Profile
      medicalHistories: medical.map((h) => ({
        id: h.id,
        conditionId: h.conditionId,
        condition: h.Condition?.name || 'Unknown',
        details: h.details,
      })),
      familyMedicalHistories: familyMedical.map((h) => ({
        id: h.id,
        conditionId: h.conditionId,
        condition: h.Condition?.name || 'Unknown',
        details: h.details,
      })),

      // Vital Signs
      vitalSigns: vitals,
      latestVitals: vitals[0] || null,

      // Physical Examinations
      physicalExaminations: exams,

      // OB/Gyn History
      obGyneHistory: obGyne || null,

      // Pediatric Measurements - Convert Decimal to number for client serialization
      pediatricMeasurements: pediatric.map((pm) => ({
        ...pm,
        length: pm.length ? Number(pm.length) : pm.length,
        headCircumference: pm.headCircumference ? Number(pm.headCircumference) : pm.headCircumference,
        skinfoldThickness: pm.skinfoldThickness ? Number(pm.skinfoldThickness) : pm.skinfoldThickness,
        waistCircumference: pm.waistCircumference ? Number(pm.waistCircumference) : pm.waistCircumference,
        hipCircumference: pm.hipCircumference ? Number(pm.hipCircumference) : pm.hipCircumference,
        limbCircumference: pm.limbCircumference ? Number(pm.limbCircumference) : pm.limbCircumference,
        midUpperArmCircumference: pm.midUpperArmCircumference ? Number(pm.midUpperArmCircumference) : pm.midUpperArmCircumference,
      })),

      // Personal History & Lifestyle
      personalHistory: personal || null,

      // Insurance & PhilHealth
      philHealthRecords: philHealth,

      // Procedure History
      procedureHistory: procedures,

      // Clinical Documents
      medicalCertificates: certificateDataList,
      referralSlips: referralDataList,
    }
  } catch (error) {
    console.error('[GET_PATIENT_HEALTH_RECORDS_CATCH] Error:', {
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error,
    })
    return null
  }
}

