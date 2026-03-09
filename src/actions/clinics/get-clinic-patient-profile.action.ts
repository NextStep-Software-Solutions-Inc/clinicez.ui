"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { requireClinicPermission } from "@/lib/permission-checker";
import { PERMISSIONS } from "@/lib/permissions";
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
            exams,
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
            prisma.physicalExamination.findMany({
                where: { userId: patient.id },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            prisma.obGyneHistory.findFirst({
                where: { userId: patient.id },
            }),
            prisma.pediatricMeasurement.findMany({
                where: { userId: patient.id },
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
                    PhilHealthMemberType: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
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
                orderBy: { usedAt: "desc" },
                take: 10,
            }),
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
            prisma.userVaccination.findMany({
                where: { userId: patient.id, isActive: true, deletedAt: null },
                include: {
                    Vaccine: { select: { name: true } },
                    Dose: { select: { dose: true } },
                    Route: { select: { route: true } },
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
                take: 20,
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
            physicalExaminations: exams.map((e) => ({
                ...e,
                createdAt: e.createdAt.toISOString(),
                updatedAt: e.updatedAt.toISOString(),
                deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
            })),

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
                remarks: p.remarks,
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
                vaccine: v.Vaccine.name,
                dose: v.Dose.dose,
                route: v.Route.route,
                dateGiven: v.dateGiven.toISOString(),
                notes: v.notes,
                administeredBy: v.administeredBy,
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
                PhilHealthMemberType: p.PhilHealthMemberType
                    ? {
                        ...p.PhilHealthMemberType,
                        createdAt: p.PhilHealthMemberType.createdAt.toISOString(),
                        updatedAt: p.PhilHealthMemberType.updatedAt.toISOString(),
                    }
                    : null,
            })),

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
        } as SerializedPatientHealthRecordsResponse;
    } catch (error) {
        console.error("[GET_CLINIC_PATIENT_PROFILE_ACTION]", {
            message: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}
