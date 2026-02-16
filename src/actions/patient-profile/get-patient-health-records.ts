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
    const user = await currentUser()
    if (!user?.id) return null

    // Get patient record with comprehensive health data
    const patient = await prisma.user.findUnique({
      where: { userId: user.id },
      include: {
        // Medical & Family History
        MedicalHistories: {
          include: {
            Condition: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 15,
        },
        FamilyMedicalHistories: {
          where: { deletedAt: null },
          include: {
            Condition: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 15,
        },

        // Vital Signs
        VitalSigns: {
          where: { isActive: true, deletedAt: null },
          orderBy: { dateTaken: 'desc' },
          take: 5,
        },

        // Physical Examinations
        PhysicalExaminations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },

        // OB/Gyn History
        ObGyneHistory: true,

        // Pediatric Measurements
        PediatricMeasurements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },

        // Personal History
        PersonalHistory: true,

        // PhilHealth Records
        PhilHealthRecords: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },

        // Procedure History
        ProcedureUsageHistory: {
          orderBy: { usedAt: 'desc' },
          take: 10,
        },

        // Clinic Patients (to get primary clinic)
        ClinicPatients: {
          where: { isActive: true, deletedAt: null },
          include: {
            Clinic: {
              select: { id: true, name: true },
            },
          },
          take: 1,
        },
      },
    })

    if (!patient) return null

    // Fetch medical certificates and referral slips from clinic
    const clinicPatient = patient.ClinicPatients[0]

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
      clinic: patient.ClinicPatients[0]?.Clinic || null,

      // Medical Profile
      medicalHistories: patient.MedicalHistories.map((h) => ({
        id: h.id,
        conditionId: h.conditionId,
        condition: h.Condition?.name || 'Unknown',
        details: h.details,
      })),
      familyMedicalHistories: patient.FamilyMedicalHistories.map((h) => ({
        id: h.id,
        conditionId: h.conditionId,
        condition: h.Condition?.name || 'Unknown',
        details: h.details,
      })),

      // Vital Signs
      vitalSigns: patient.VitalSigns,
      latestVitals: patient.VitalSigns[0] || null,

      // Physical Examinations
      physicalExaminations: patient.PhysicalExaminations,

      // OB/Gyn History
      obGyneHistory: patient.ObGyneHistory || null,

      // Pediatric Measurements
      pediatricMeasurements: patient.PediatricMeasurements,

      // Personal History & Lifestyle
      personalHistory: patient.PersonalHistory || null,

      // Insurance & PhilHealth
      philHealthRecords: patient.PhilHealthRecords,

      // Procedure History
      procedureHistory: patient.ProcedureUsageHistory,

      // Clinical Documents
      medicalCertificates: certificateDataList,
      referralSlips: referralDataList,
    }
  } catch (error) {
    console.error('Error fetching patient health records:', error)
    return null
  }
}

