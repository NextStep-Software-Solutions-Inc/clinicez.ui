"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { requireClinicPermission } from "@/lib/permission-checker";
import { PERMISSIONS } from "@/lib/permissions";
import { calculateDetailedAge } from "@/lib/utils";
import type { SerializedPatientHealthRecordsResponse } from "@/types/patient-profile";

/**
 * Fetches the full health records for a clinic patient by their Prisma user.id.
 * Requires the requesting user to have READ:CLINIC:PATIENT:ALL or own the record.
 */
export async function getClinicPatientProfileAction({
    clinicUid,
    patientId,
}: {
    clinicUid: string;
    patientId: number;
}): Promise<SerializedPatientHealthRecordsResponse | null> {
    try {
        const session = await getCachedSession();
        if (!session?.user?.sub) {
            throw new Error("Unauthorized");
        }

        // Verify the accessing user has READ:CLINIC:PATIENT:ALL permission in this clinic
        await requireClinicPermission(
            session.user.sub,
            clinicUid,
            PERMISSIONS.CLINIC["READ:CLINIC:PATIENT:ALL"].name,
            "view patient record"
        );

        // Verify clinic<->patient link is active
        const clinicPatientRecord = await prisma.clinicPatient.findFirst({
            where: {
                Clinic: { clinicUid },
                Patient: { id: patientId },
                isActive: true,
                deletedAt: null,
            },
            include: {
                Clinic: { select: { id: true, name: true } },
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
        });

        if (!clinicPatientRecord) {
            throw new Error("Patient is not a member of this clinic");
        }

        // Fetch core patient record
        const patient = await prisma.user.findUnique({
            where: { id: patientId },
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
        });

        if (!patient) {
            return null;
        }

        // Parallel fetch of all related data
        const [
            medical,
            familyMedical,
            vitals,
            obGyne,
            pediatric,
            personal,
            philHealth,
            procedures,
            allergies,
            emergencyContacts,
            vaccinations,
            disabilities,
            addresses,
            surgical,
            physicalExaminations,
            ncdQuestionnaire,
            studentRecords,
            userEmployments,
        ] = await Promise.all([
            prisma.medicalHistory.findMany({
                where: { userId: patient.id },
                include: { Condition: { select: { id: true, name: true } } },
                orderBy: { createdAt: "desc" },
                take: 15,
            }),
            prisma.familyMedicalHistory.findMany({
                where: { userId: patient.id, deletedAt: null },
                include: { Condition: { select: { id: true, name: true } } },
                orderBy: { createdAt: "desc" },
                take: 15,
            }),
            prisma.vitalSign.findMany({
                where: { userId: patient.id, isActive: true, deletedAt: null },
                orderBy: { dateTaken: "desc" },
                take: 5,
            }),

            prisma.obGyneHistory.findFirst({
                where: { userId: patient.id },
            }),
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
                orderBy: { dateTaken: "asc" },
                take: 100,
            }),
            prisma.personalHistory.findFirst({
                where: { userId: patient.id },
            }),
            prisma.philHealthRecord.findMany({
                where: { userId: patient.id, isActive: true },
                include: {
                    PhilHealthDependents: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            Promise.resolve([] as any[]),
            prisma.userAllergy.findMany({
                where: { userId: patient.id },
                select: {
                    id: true,
                    reaction: true,
                    notes: true,
                    Allergen: { select: { name: true } },
                },
            }) as Promise<
                Array<{
                    id: number;
                    reaction: string;
                    notes: string | null;
                    Allergen: { name: string };
                }>
            >,
            prisma.userEmergencyContact.findMany({
                where: { userId: patient.id, isActive: true },
                orderBy: { createdAt: "desc" },
            }),
            prisma.patientImmunization.findMany({
                where: { userId: patient.id, isActive: true, deletedAt: null },
                include: {
                    PhilHealthImmunization: { select: { name: true, code: true } },
                },
                orderBy: { dateGiven: "desc" },
                take: 20,
            }),
            prisma.userDisability.findMany({
                where: { userId: patient.id },
                include: {
                    Disability: { select: { name: true } },
                    DiagnosedBy: { select: { firstName: true, lastName: true } },
                },
                orderBy: { dateDiagnosed: "desc" },
                take: 20,
            }),
            prisma.userAddress.findMany({
                where: { userId: patient.id, isActive: true },
                orderBy: { createdAt: "desc" },
            }),
            prisma.surgicalHistory.findMany({
                where: { userId: patient.id, deletedAt: null },
                orderBy: { createdAt: "desc" },
                take: 15,
            }),
            prisma.physicalExamination.findMany({
                where: { userId: patient.id, deletedAt: null },
                orderBy: { createdAt: "desc" },
                take: 5,
            }),
            prisma.patientNcdQuestionnaire.findUnique({
                where: { patientId: patient.id },
            }),
            prisma.userStudentRecord.findMany({
                where: { userId: patient.id, isActive: true },
                include: {
                    Organization: { select: { name: true } },
                    Program: { select: { name: true } },
                    OrganizationYearLevel: { select: { name: true } },
                    College: { select: { name: true } },
                    Department: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.userEmploymentRecord.findMany({
                where: { userId: patient.id, isActive: true },
                include: {
                    Organization: { select: { name: true } },
                    Department: { select: { name: true } },
                    College: { select: { name: true } },
                    Office: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        // Fetch clinical documents scoped to this clinic
        const [certs, slips] = await Promise.all([
            prisma.clinicMedicalCertificate.findMany({
                where: {
                    clinicId: clinicPatientRecord.clinicId,
                    isActive: true,
                    clinicPatientId: clinicPatientRecord.id,
                },
                include: {
                    Clinic: { select: { id: true, name: true } },
                    CreatedBy: { select: { firstName: true, lastName: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            prisma.clinicReferralSlip.findMany({
                where: {
                    clinicId: clinicPatientRecord.clinicId,
                    isActive: true,
                    clinicPatientId: clinicPatientRecord.id,
                },
                include: {
                    Clinic: { select: { id: true, name: true } },
                    CreatedBy: { select: { firstName: true, lastName: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
        ]);

        return {
            // Demographics
            id: patient.id,
            clinicPatientId: clinicPatientRecord.id,
            userId: patient.userId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            middleName: patient.middleName,
            fullName: `${patient.firstName ?? ""} ${patient.middleName ? patient.middleName + " " : ""}${patient.lastName ?? ""}`.trim(),
            picture: patient.picture,
            email: patient.email,
            mobile: patient.mobile,
            telephone: patient.telephone,
            dob: patient.dob ? patient.dob.toISOString() : null,
            age: patient.dob
                ? Math.floor(
                    (new Date().getTime() - new Date(patient.dob).getTime()) /
                    (365.25 * 24 * 60 * 60 * 1000)
                )
                : null,
            detailedAge: calculateDetailedAge(patient.dob),
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
            clinic: clinicPatientRecord.Clinic ?? null,
            ncdQuestionnaire: ncdQuestionnaire
                ? {
                    id: ncdQuestionnaire.id,
                    q1: ncdQuestionnaire.q1 || '',
                    q2: ncdQuestionnaire.q2 || '',
                    q3: ncdQuestionnaire.q3 || '',
                    q4: ncdQuestionnaire.q4 || '',
                    q5: ncdQuestionnaire.q5 || '',
                    q6: ncdQuestionnaire.q6 || '',
                    q7: ncdQuestionnaire.q7 || '',
                    q8: ncdQuestionnaire.q8 || '',
                    q9: ncdQuestionnaire.q9 || '',
                    q10: ncdQuestionnaire.q10 || '',
                    q11: ncdQuestionnaire.q11 || '',
                    q12: ncdQuestionnaire.q12 || '',
                    q13: ncdQuestionnaire.q13 || '',
                    q14: ncdQuestionnaire.q14 || '',
                    q15: ncdQuestionnaire.q15 || '',
                    q16: ncdQuestionnaire.q16 || '',
                    q17: ncdQuestionnaire.q17 || '',
                    q18: ncdQuestionnaire.q18 || '',
                    q19: ncdQuestionnaire.q19 || '',
                    q19_Fbsmg: ncdQuestionnaire.q19_Fbsmg || '',
                    q19_Fbsmmol: ncdQuestionnaire.q19_Fbsmmol || '',
                    q19_Fbsdate: ncdQuestionnaire.q19_Fbsdate ? ncdQuestionnaire.q19_Fbsdate.toISOString() : null,
                    q20: ncdQuestionnaire.q20 || '',
                    q20_Choleval: ncdQuestionnaire.q20_Choleval || '',
                    q20_Choledate: ncdQuestionnaire.q20_Choledate ? ncdQuestionnaire.q20_Choledate.toISOString() : null,
                    q21: ncdQuestionnaire.q21 || '',
                    q21_Ketonval: ncdQuestionnaire.q21_Ketonval || '',
                    q21_Ketondate: ncdQuestionnaire.q21_Ketondate ? ncdQuestionnaire.q21_Ketondate.toISOString() : null,
                    q22: ncdQuestionnaire.q22 || '',
                    q22_Proteinval: ncdQuestionnaire.q22_Proteinval || '',
                    q22_Proteindate: ncdQuestionnaire.q22_Proteindate ? ncdQuestionnaire.q22_Proteindate.toISOString() : null,
                    q23: ncdQuestionnaire.q23 || '',
                    q24: ncdQuestionnaire.q24 || '',
                  }
                : null,

            // Medical Profile
            medicalHistories: medical.map((h) => ({
                id: h.id,
                conditionId: h.conditionId,
                condition: h.Condition?.name ?? "Unknown",
                details: h.details,
            })),
            familyMedicalHistories: familyMedical.map((h) => ({
                id: h.id,
                conditionId: h.conditionId,
                condition: h.Condition?.name ?? "Unknown",
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
            vitalSigns: vitals.map((v) => ({
                ...v,
                dateTaken: v.dateTaken.toISOString(),
                createdAt: v.createdAt.toISOString(),
                updatedAt: v.updatedAt.toISOString(),
                deletedAt: v.deletedAt ? v.deletedAt.toISOString() : null,
            })),
            latestVitals: vitals[0]
                ? {
                    ...vitals[0],
                    dateTaken: vitals[0].dateTaken.toISOString(),
                    createdAt: vitals[0].createdAt.toISOString(),
                    updatedAt: vitals[0].updatedAt.toISOString(),
                    deletedAt: vitals[0].deletedAt ? vitals[0].deletedAt.toISOString() : null,
                }
                : null,

            // Physical Examinations
            physicalExaminations: physicalExaminations.map((pe) => ({
                ...pe,
                createdAt: pe.createdAt.toISOString(),
                updatedAt: pe.updatedAt.toISOString(),
                deletedAt: pe.deletedAt ? pe.deletedAt.toISOString() : null,
            })),
            latestPhysicalExam: physicalExaminations[0]
                ? {
                    ...physicalExaminations[0],
                    createdAt: physicalExaminations[0].createdAt.toISOString(),
                    updatedAt: physicalExaminations[0].updatedAt.toISOString(),
                    deletedAt: physicalExaminations[0].deletedAt ? physicalExaminations[0].deletedAt.toISOString() : null,
                }
                : null,

            // OB/Gyn History
            obGyneHistory: obGyne
                ? {
                    ...obGyne,
                    createdAt: obGyne.createdAt.toISOString(),
                    updatedAt: obGyne.updatedAt.toISOString(),
                    deletedAt: obGyne.deletedAt ? obGyne.deletedAt.toISOString() : null,
                }
                : null,

            // Pediatric Measurements
            pediatricMeasurements: pediatric.map((p) => ({
                id: p.id,
                userId: p.userId,
                dateTaken: p.dateTaken.toISOString(),
                length: p.length ? Number(p.length) : null,
                headCircumference: p.headCircumference ? Number(p.headCircumference) : null,
                skinfoldThickness: p.skinfoldThickness ? Number(p.skinfoldThickness) : null,
                waistCircumference: p.waistCircumference ? Number(p.waistCircumference) : null,
                hipCircumference: p.hipCircumference ? Number(p.hipCircumference) : null,
                limbCircumference: p.limbCircumference ? Number(p.limbCircumference) : null,
                midUpperArmCircumference: p.midUpperArmCircumference
                    ? Number(p.midUpperArmCircumference)
                    : null,
                notes: p.notes,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
            })),

            // Personal History & Lifestyle
            personalHistory: personal
                ? {
                    ...personal,
                    createdAt: personal.createdAt.toISOString(),
                    updatedAt: personal.updatedAt.toISOString(),
                    deletedAt: personal.deletedAt ? personal.deletedAt.toISOString() : null,
                }
                : null,

            // Allergies
            userAllergies: allergies.map((a) => ({
                id: a.id,
                allergen: a.Allergen.name,
                reaction: a.reaction,
                notes: a.notes,
            })),

            // Emergency Contacts
            userEmergencyContacts: emergencyContacts.map((c) => ({
                id: c.id,
                name: `${c.firstName} ${c.lastName}`,
                firstName: c.firstName ?? "",
                lastName: c.lastName ?? "",
                middleName: c.middleName,
                suffix: c.suffix,
                relationship: c.relationship,
                phone: c.phone,
                isPrimary: c.isPrimary,
                address: c.address,
            })),

            // Vaccinations
            userVaccinations: vaccinations.map((v) => ({
                id: v.id,
                vaccine: v.vaccineName,
                dose: v.doseNumber,
                route: v.route || 'N/A',
                dateGiven: v.dateGiven.toISOString(),
                notes: v.notes,
                administeredBy: v.administeredBy,
                category: v.category,
                code: v.code,
            })),

            // Disabilities
            userDisabilities: disabilities.map((d) => ({
                id: d.id,
                disability: d.Disability.name,
                dateDiagnosed: d.dateDiagnosed ? d.dateDiagnosed.toISOString() : null,
                severity: d.severity,
                notes: d.notes,
                isManaged: d.isManaged,
                reason: d.reason,
                diagnosedBy: d.DiagnosedBy
                    ? `${d.DiagnosedBy.firstName} ${d.DiagnosedBy.lastName}`
                    : null,
            })),

            // Addresses
            userAddresses: addresses.map((a) => ({
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

            // Insurance & PhilHealth
            philHealthRecords: philHealth.map((p) => ({
                ...p,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
                pinVerifiedAt: p.pinVerifiedAt ? p.pinVerifiedAt.toISOString() : null,
            })),
            yakapEnlistment: clinicPatientRecord.PhilHealthKonsultaEnlistments?.[0] ? {
                id: clinicPatientRecord.PhilHealthKonsultaEnlistments[0].id,
                hciCaseNo: clinicPatientRecord.PhilHealthKonsultaEnlistments[0].hciCaseNo,
                profilingTransNo: clinicPatientRecord.PhilHealthKonsultaEnlistments[0].profilingTransNo
            } : undefined,

            // Procedure History
            procedureHistory: procedures.map((p) => ({
                ...p,
                usedAt: p.usedAt.toISOString(),
            })),

            // Clinical Documents
            medicalCertificates: certs.map((cert) => ({
                id: cert.id,
                serialNumber: cert.serialNumber,
                transactionNumber: cert.transactionNumber,
                createdAt: cert.createdAt.toISOString(),
                clinic: cert.Clinic?.name,
                createdBy: cert.CreatedBy
                    ? `${cert.CreatedBy.firstName} ${cert.CreatedBy.lastName}`
                    : "Unknown",
            })),
            referralSlips: slips.map((slip) => ({
                id: slip.id,
                serialNumber: slip.serialNumber,
                transactionNumber: slip.transactionNumber,
                referredTo: slip.referredTo,
                reason: slip.reason,
                createdAt: slip.createdAt.toISOString(),
                clinic: slip.Clinic?.name,
                createdBy: slip.CreatedBy
                    ? `${slip.CreatedBy.firstName} ${slip.CreatedBy.lastName}`
                    : "Unknown",
            })),

            // Student & Employment Records
            studentRecords: studentRecords.map((sr) => ({
                id: sr.id,
                studentId: sr.studentId,
                lrn: sr.lrn,
                level: sr.level,
                organizationName: sr.Organization?.name ?? null,
                programName: sr.Program?.name ?? null,
                yearLevelName: sr.OrganizationYearLevel?.name ?? null,
                collegeName: sr.College?.name ?? null,
                departmentName: sr.Department?.name ?? null,
            })),
            userEmployments: userEmployments.map((emp) => ({
                id: emp.id,
                employeeId: emp.employeeId,
                position: emp.position,
                designation: emp.designation,
                organizationName: emp.Organization?.name ?? null,
                departmentName: emp.Department?.name ?? null,
                collegeName: emp.College?.name ?? null,
                officeName: emp.Office?.name ?? null,
            })),
        } as SerializedPatientHealthRecordsResponse;
    } catch (error) {
        console.error("[GET_CLINIC_PATIENT_PROFILE_ACTION]", error);
        return null;
    }
}
