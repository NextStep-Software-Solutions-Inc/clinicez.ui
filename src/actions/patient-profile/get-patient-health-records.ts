'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

import type {
  SerializedPatientHealthRecordsResponse,
  CertificateData,
  ReferralData,
} from '@/types/patient-profile'

export async function getPatientHealthRecords(): Promise<SerializedPatientHealthRecordsResponse | null> {
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
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!patient) {
      return null
    }

    // Fetch related data in separate queries
    const [medical, familyMedical, vitals, obGyne, physicalExaminations, pediatric, personal, philHealth, procedures, clinicPatients, allergies, emergencyContacts, vaccinations, disabilities, addresses, surgical, ncdQuestionnaire] = await Promise.all([
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

      // OB/Gyn History
      prisma.obGyneHistory.findFirst({
        where: { userId: patient.id },
      }),
      // Physical Examinations
      prisma.physicalExamination.findMany({
        where: { userId: patient.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
      // Pediatric Measurements
      prisma.vitalSign.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Procedure History
      prisma.procedureUsageHistory.findMany({
        where: { userId: patient.id },
        select: {
          id: true,
          userId: true,
          clinicId: true,
          procedureType: true,
          procedureId: true,
          procedureName: true,
          usedAt: true,
          clinicPatientId: true,
        },
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
      // Allergies
      prisma.userAllergy.findMany({
        where: { userId: patient.id },
        select: {
          id: true,
          reaction: true,
          notes: true,
          Allergen: {
            select: { name: true },
          },
        },
      }) as Promise<Array<{ id: number; reaction: string; notes: string | null; Allergen: { name: string } }>>,
      // Emergency Contacts
      prisma.userEmergencyContact.findMany({
        where: { userId: patient.id, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      // Vaccinations
      prisma.userVaccination.findMany({
        where: { userId: patient.id, isActive: true, deletedAt: null },
        include: {
          Vaccine: {
            select: { name: true },
          },
          Dose: {
            select: { dose: true },
          },
          Route: {
            select: { route: true },
          },
        },
        orderBy: { dateGiven: 'desc' },
        take: 20,
      }),
      // Disabilities
      prisma.userDisability.findMany({
        where: { userId: patient.id },
        include: {
          Disability: {
            select: { name: true },
          },
          DiagnosedBy: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { dateDiagnosed: 'desc' },
        take: 20,
      }),
      // Addresses
      prisma.userAddress.findMany({
        where: { userId: patient.id, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      // Surgical History
      prisma.surgicalHistory.findMany({
        where: { userId: patient.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // NCD Questionnaire
      prisma.patientNcdQuestionnaire.findUnique({
        where: { patientId: patient.id },
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
        createdAt: cert.createdAt.toISOString(),
        clinic: cert.Clinic?.name,
        createdBy: cert.CreatedBy ? `${cert.CreatedBy.firstName} ${cert.CreatedBy.lastName}` : 'Unknown',
      }))

      referralDataList = slips.map((slip) => ({
        id: slip.id,
        serialNumber: slip.serialNumber,
        transactionNumber: slip.transactionNumber,
        referredTo: slip.referredTo,
        reason: slip.reason,
        createdAt: slip.createdAt.toISOString(),
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
      dob: patient.dob ? patient.dob.toISOString() : null,
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
      verificationStatus: patient.verificationStatus,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
      clinic: clinicPatients[0]?.Clinic || null,
      ncdQuestionnaire: ncdQuestionnaire ? { id: ncdQuestionnaire.id } : null,

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
      surgicalHistories: surgical.map((s) => ({
        id: s.id,
        operationName: s.operationName,
        operationDate: s.operationDate ? s.operationDate.toISOString() : null,
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        deletedAt: s.deletedAt ? s.deletedAt.toISOString() : null,
      })),

      // Vital Signs
      vitalSigns: vitals.map(v => ({
        ...v,
        length: v.length ? Number(v.length) : null,
        headCircumference: v.headCircumference ? Number(v.headCircumference) : null,
        skinfoldThickness: v.skinfoldThickness ? Number(v.skinfoldThickness) : null,
        waistCircumference: v.waistCircumference ? Number(v.waistCircumference) : null,
        hipCircumference: v.hipCircumference ? Number(v.hipCircumference) : null,
        limbCircumference: v.limbCircumference ? Number(v.limbCircumference) : null,
        midUpperArmCircumference: v.midUpperArmCircumference ? Number(v.midUpperArmCircumference) : null,
        dateTaken: v.dateTaken.toISOString(),
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        deletedAt: v.deletedAt ? v.deletedAt.toISOString() : null,
      })) as any,
      latestVitals: vitals[0] ? {
        ...vitals[0],
        length: vitals[0].length ? Number(vitals[0].length) : null,
        headCircumference: vitals[0].headCircumference ? Number(vitals[0].headCircumference) : null,
        skinfoldThickness: vitals[0].skinfoldThickness ? Number(vitals[0].skinfoldThickness) : null,
        waistCircumference: vitals[0].waistCircumference ? Number(vitals[0].waistCircumference) : null,
        hipCircumference: vitals[0].hipCircumference ? Number(vitals[0].hipCircumference) : null,
        limbCircumference: vitals[0].limbCircumference ? Number(vitals[0].limbCircumference) : null,
        midUpperArmCircumference: vitals[0].midUpperArmCircumference ? Number(vitals[0].midUpperArmCircumference) : null,
        dateTaken: vitals[0].dateTaken.toISOString(),
        createdAt: vitals[0].createdAt.toISOString(),
        updatedAt: vitals[0].updatedAt.toISOString(),
        deletedAt: vitals[0].deletedAt ? vitals[0].deletedAt.toISOString() : null,
      } as any : null,



      // OB/Gyn History
      obGyneHistory: obGyne ? {
        ...obGyne,
        createdAt: obGyne.createdAt.toISOString(),
        updatedAt: obGyne.updatedAt.toISOString(),
        deletedAt: obGyne.deletedAt ? obGyne.deletedAt.toISOString() : null,
      } : null,

      // Physical Examinations
      physicalExaminations: physicalExaminations.map((pe) => ({
        ...pe,
        createdAt: pe.createdAt.toISOString(),
        updatedAt: pe.updatedAt.toISOString(),
        deletedAt: pe.deletedAt ? pe.deletedAt.toISOString() : null,
      })),
      latestPhysicalExam: physicalExaminations[0] ? {
        ...physicalExaminations[0],
        createdAt: physicalExaminations[0].createdAt.toISOString(),
        updatedAt: physicalExaminations[0].updatedAt.toISOString(),
        deletedAt: physicalExaminations[0].deletedAt ? physicalExaminations[0].deletedAt.toISOString() : null,
      } : null,

      // Pediatric Measurements
      pediatricMeasurements: pediatric.map(p => ({
        id: p.id,
        userId: p.userId,
        dateTaken: p.dateTaken.toISOString(),
        length: p.length ? Number(p.length) : null,
        headCircumference: p.headCircumference ? Number(p.headCircumference) : null,
        skinfoldThickness: p.skinfoldThickness ? Number(p.skinfoldThickness) : null,
        waistCircumference: p.waistCircumference ? Number(p.waistCircumference) : null,
        hipCircumference: p.hipCircumference ? Number(p.hipCircumference) : null,
        limbCircumference: p.limbCircumference ? Number(p.limbCircumference) : null,
        midUpperArmCircumference: p.midUpperArmCircumference ? Number(p.midUpperArmCircumference) : null,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
      })),

      // Personal History & Lifestyle
      personalHistory: personal ? {
        ...personal,
        createdAt: personal.createdAt.toISOString(),
        updatedAt: personal.updatedAt.toISOString(),
        deletedAt: personal.deletedAt ? personal.deletedAt.toISOString() : null,
      } : null,

      // Allergies
      userAllergies: allergies.map((allergy) => ({
        id: allergy.id,
        allergen: allergy.Allergen.name,
        reaction: allergy.reaction,
        notes: allergy.notes,
      })),

      // Emergency Contacts
      userEmergencyContacts: emergencyContacts.map((contact) => ({
        id: contact.id,
        name: `${contact.firstName} ${contact.lastName}`,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        middleName: contact.middleName,
        suffix: contact.suffix,
        relationship: contact.relationship,
        phone: contact.phone,
        isPrimary: contact.isPrimary,
        address: contact.address,
      })),

      // Vaccinations
      userVaccinations: vaccinations.map((vac) => ({
        id: vac.id,
        vaccine: vac.Vaccine.name,
        dose: vac.Dose.dose,
        route: vac.Route.route,
        dateGiven: vac.dateGiven.toISOString(),
        notes: vac.notes,
        administeredBy: vac.administeredBy,
      })),

      // Disabilities & Illnesses
      userDisabilities: disabilities.map((dis) => ({
        id: dis.id,
        disability: dis.Disability.name,
        dateDiagnosed: dis.dateDiagnosed ? dis.dateDiagnosed.toISOString() : null,
        severity: dis.severity,
        notes: dis.notes,
        isManaged: dis.isManaged,
        reason: dis.reason,
        diagnosedBy: dis.DiagnosedBy ? `${dis.DiagnosedBy.firstName} ${dis.DiagnosedBy.lastName}` : null,
      })),

      // Addresses
      userAddresses: addresses.map((addr) => ({
        id: addr.id,
        address: addr.address,
        apartmentUnit: addr.apartmentUnit,
        bldgName: addr.bldgName,
        addressLine: addr.addressLine,
        street: addr.street,
        subdivision: addr.subdivision,
        region: addr.region,
        barangay: addr.barangay,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country,
        isPrimary: addr.isPrimary,
      })),

      // Insurance & PhilHealth
      philHealthRecords: philHealth.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
      })),

      // Procedure History
      procedureHistory: procedures.map(p => ({
        ...p,
        usedAt: p.usedAt.toISOString(),
      })),

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

