"use server";
// ─── System-level Konsulta Credentials (never exposed to client) ────────────
const KONSULTA_SOFTWARE_CERT_ID =
    process.env.PHILHEALTH_KONSULTA_SOFTWARE_CERT_ID;
const KONSULTA_CIPHER_KEY = process.env.PHILHEALTH_KONSULTA_CIPHER_KEY;

import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";
import { formatKonsultaHciNumber } from "@/lib/format-sequence";
import { getNextSequenceNumber } from "@/lib/sequence-generator";
import {
    resolveMappedDiagnosticsForConsultations,
    resolveMappedIcdCodesForConsultations,
    resolveMappedImmunizationsForPatients,
    resolveMappedManagementForConsultations,
    resolveMappedMedicalHistoryForPatients,
    resolveMappedMedicinesForConsultations,
    resolveMappedPhysicalExamFindingsForConsultations,
} from "@/lib/konsulta-library-persistence";
import {
    extractGeneratedKonsultaBatchDeficiencies,
    summarizeGeneratedKonsultaBatchDeficiencies,
    type StructuredKonsultaBatchDeficiency,
} from "@/lib/konsulta-batch-deficiencies";
import { withErrorHandling } from "@/lib/with-error-handling";
import {
    buildPcbXml,
    generateTransmittalNumber,
} from "@/services/konsulta/pcb-xml-builder";
import type {
    KonsultaEnlistmentData,
    KonsultaPatientType,
    KonsultaProfileData,
    KonsultaProfileSubData,
    KonsultaSoapData,
    KonsultaSoapSubData,
    KonsultaYN,
} from "@/services/konsulta/types";
import {
    decryptXmlPayload,
    encryptXmlPayload,
} from "@/services/konsulta/xml-encryption.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GetPhilHealthPatients = Awaited<
    ReturnType<typeof getPhilHealthPatientsAction>
>;
export type GetAllClinicPatientsWithPhilHealthStatus = Awaited<
    ReturnType<typeof getAllClinicPatientsWithPhilHealthStatusAction>
>;
export type GetPhilHealthConsultations = Awaited<
    ReturnType<typeof getPhilHealthConsultationsAction>
>;
export type GetKonsultaBatches = Awaited<
    ReturnType<typeof getKonsultaBatchesAction>
>;
export type GetKonsultaBatch = Awaited<
    ReturnType<typeof getKonsultaBatchAction>
>;
export type CheckEnrolledPatientsRegistrationBatch = Awaited<
    ReturnType<typeof checkEnrolledPatientsRegistrationBatchAction>
>;

type KonsultaPatientListKind = "ENROLLED" | "UNENROLLED";

type GetKonsultaPatientListParams = {
    clinicUid: string;
    kind: KonsultaPatientListKind;
    skip?: number;
    take?: number;
    search?: string;
};

type UpsertKonsultaPatientEnrollmentPayload = {
    clinicUid: string;
    clinicPatientId: number;
    pin: string;
    patientType: KonsultaPatientType;
    memberPin?: string | null;
    philSysId?: string | null;
    tin?: string | null;
};

type ClinicPatientIdentity = {
    clinicPatientId: number;
    userId: number;
    userUid: string;
    patientName: string;
    pin: string;
    patientType: KonsultaPatientType;
};

const MAX_DEFICIENCY_MESSAGES_TO_DISPLAY = 8;
const GENERATED_DEFICIENCY_DOMAIN_LABELS = {
    diagnostics: "Diagnostics",
    management: "Management",
    medicines: "Medicines",
    medicalHistory: "Medical history",
    immunizations: "Immunizations",
    physicalExam: "Physical exam findings",
} as const;

type BatchEntryWithPatient = {
    id: number;
    patientUserId: number;
    philHealthPin: string;
    Patient: {
        firstName: string | null;
        lastName: string | null;
    };
};

function formatBatchEntryPatientName(entry: BatchEntryWithPatient): string {
    return [
        entry.Patient.firstName ?? "",
        entry.Patient.lastName ?? "",
    ]
        .join(" ")
        .trim() || "Unknown patient";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveClinicId(clinicUid: string): Promise<number> {
    const clinic = await prisma.clinic.findFirst({
        where: { clinicUid, isActive: true },
        select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");
    return clinic.id;
}

async function getClinicKonsultaCredentials(clinicId: number) {
    const setting = await prisma.clinicSetting.findFirst({
        where: { clinicId },
        select: {
            konsultaUsername: true,
            konsultaPassword: true,
            philhealthAccreditationNumber: true,
            pmccNumber: true,
        },
    });
    if (
        typeof setting?.konsultaUsername === "undefined" ||
        typeof setting.konsultaPassword === "undefined" ||
        !setting.philhealthAccreditationNumber ||
        !setting.pmccNumber
    ) {
        throw new Error(
            "PhilHealth Konsulta credentials are not fully configured in Clinic Settings.",
        );
    }
    if (!KONSULTA_SOFTWARE_CERT_ID || !KONSULTA_CIPHER_KEY) {
        throw new Error(
            "Konsulta system certificate ID and cipher key are not set in environment variables.",
        );
    }
    return {
        username: setting.konsultaUsername ?? "",
        password: setting.konsultaPassword ?? "",
        hciAccreNo: setting.philhealthAccreditationNumber,
        pmccNumber: setting.pmccNumber,
        certificationId: KONSULTA_SOFTWARE_CERT_ID,
        cipherKey: KONSULTA_CIPHER_KEY,
    };
}

function currentEffYear(): string {
    return String(new Date().getFullYear());
}

function normalizePage(skip = 0, take = 30): { skip: number; take: number } {
    return {
        skip: Math.max(0, skip),
        take: Math.min(Math.max(1, take), 50),
    };
}

function pushUniqueMappedCode(result: Map<number, string[]>, key: number, nextCode: string | null): void {
    if (!nextCode) {
        return;
    }

    const existingCodes = result.get(key) ?? [];
    if (!existingCodes.includes(nextCode)) {
        existingCodes.push(nextCode);
        result.set(key, existingCodes);
    }
}

type MutableInputJsonObject = { [key: string]: Prisma.InputJsonValue | null };

function toInputJsonValue(value: unknown): Prisma.InputJsonValue | null {
    if (value === null || value === undefined) return null;
    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    )
        return value;
    if (Array.isArray(value)) return value.map((item) => toInputJsonValue(item));
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object") {
        const output: MutableInputJsonObject = {};
        for (const [key, child] of Object.entries(value)) {
            output[key] = toInputJsonValue(child);
        }
        return output;
    }
    return String(value);
}

function isMutableInputJsonObject(
    value: Prisma.InputJsonValue | null,
): value is MutableInputJsonObject {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function toInputJsonObject(value: unknown): Prisma.InputJsonObject {
    const jsonValue = toInputJsonValue(value);
    if (isMutableInputJsonObject(jsonValue)) return jsonValue;
    return { raw: jsonValue };
}

function parseSoapReturn(raw: string): Prisma.InputJsonObject {
    let value: unknown = raw;
    try {
        value = JSON.parse(raw) as unknown;
    } catch {
        return { raw };
    }
    if (typeof value === "string") {
        try {
            value = JSON.parse(value) as unknown;
        } catch {
            return toInputJsonObject({ raw: value });
        }
    }
    return toInputJsonObject(value);
}

function extractSoapResultText(result: Prisma.InputJsonObject): string {
    const candidates = [result.result, result.return, result.message, result.raw];
    const found = candidates.find(
        (v) =>
            typeof v === "string" || typeof v === "number" || typeof v === "boolean",
    );
    return found === undefined ? JSON.stringify(result) : String(found);
}

function isAffirmativeSoapResult(result: Prisma.InputJsonObject): boolean {
    const text = extractSoapResultText(result).trim().toLowerCase();
    return (
        ["yes", "y", "true", "1", "valid", "registered"].includes(text) ||
        (text.includes("yes") && !text.includes("not")) ||
        (text.includes("valid") && !text.includes("invalid"))
    );
}

async function getKonsultaTokenForClinic(clinicId: number): Promise<string> {
    const credentials = await getClinicKonsultaCredentials(clinicId);
    console.log({ credentials });
    const { getToken: konsultaGetToken } = await import(
        "@/services/konsulta/konsulta-soap.service"
    );
    const tokenRaw = await konsultaGetToken({
        pUsername: credentials.username,
        pUserPassword: credentials.password,
        pSoftwareCertificationId: credentials.certificationId,
        pHospitalCode: credentials.hciAccreNo,
    });
    console.log({ tokenRaw });
    let token = tokenRaw.return;
    try {
        token = (JSON.parse(token) as { result?: string }).result ?? token;
    } catch {
        /* plain string */
    }
    return token;
}

async function resolveDefaultMemberTypeId(
    tx: Prisma.TransactionClient,
): Promise<number> {
    const memberType = await tx.philHealthMemberType.findFirst({
        where: { isActive: true },
        orderBy: { id: "asc" },
        select: { id: true },
    });
    if (!memberType)
        throw new Error("PhilHealth member type reference data is not configured.");
    return memberType.id;
}

// ─── Patients ─────────────────────────────────────────────────────────────────

const KONSULTA_PATIENT_SELECT = {
    id: true,
    konsultaPatientType: true,
    konsultaEffYear: true,
    konsultaMemberPin: true,
    konsultaRegistrationStatus: true,
    konsultaRegisteredAt: true,
    konsultaRegistrationCheckedAt: true,
    konsultaRegistrationResult: true,
    Patient: {
        select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            middleName: true,
            suffix: true,
            gender: true,
            dob: true,
            mobile: true,
            PhilHealthRecords: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    pin: true,
                    memberTypeId: true,
                    pinVerificationStatus: true,
                    pinVerifiedAt: true,
                    PhilHealthMemberType: { select: { name: true, category: true } },
                },
                take: 1,
            },
        },
    },
} satisfies Prisma.ClinicPatientSelect;

function buildPatientSearch(search: string): Prisma.UserWhereInput | undefined {
    const q = search.trim();
    if (!q) return undefined;
    return {
        OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { middleName: { contains: q, mode: "insensitive" } },
            {
                PhilHealthRecords: {
                    some: { deletedAt: null, pin: { contains: q, mode: "insensitive" } },
                },
            },
        ],
    };
}

/** Returns clinic patients currently registered to this HCI for the effective year. */
export const getPhilHealthPatientsAction = withErrorHandling(
    async (clinicUid: string) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);
        const effYear = currentEffYear();

        const patients = await prisma.clinicPatient.findMany({
            where: {
                clinicId,
                isActive: true,
                deletedAt: null,
                konsultaEffYear: effYear,
                konsultaRegistrationStatus: "REGISTERED",
            },
            select: KONSULTA_PATIENT_SELECT,
            orderBy: [
                { Patient: { lastName: "asc" } },
                { Patient: { firstName: "asc" } },
            ],
        });

        return {
            message: "PhilHealth patients retrieved",
            data: patients,
        };
    },
);

/** Returns one independently paginated Konsulta patient feed. */
export const getAllClinicPatientsWithPhilHealthStatusAction = withErrorHandling(
    async ({
        clinicUid,
        kind,
        skip = 0,
        take = 30,
        search = "",
    }: GetKonsultaPatientListParams) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);
        const effYear = currentEffYear();
        const page = normalizePage(skip, take);
        const patientSearch = buildPatientSearch(search);
        const registrationFilter: Prisma.ClinicPatientWhereInput =
            kind === "ENROLLED"
                ? { konsultaEffYear: effYear, konsultaRegistrationStatus: "REGISTERED" }
                : {
                    OR: [
                        { konsultaEffYear: null },
                        { konsultaEffYear: { not: effYear } },
                        { konsultaRegistrationStatus: null },
                        { konsultaRegistrationStatus: { not: "REGISTERED" } },
                    ],
                };

        const where: Prisma.ClinicPatientWhereInput = {
            clinicId,
            isActive: true,
            deletedAt: null,
            ...(patientSearch ? { Patient: patientSearch } : {}),
            ...registrationFilter,
        };

        const [patients, total] = await prisma.$transaction([
            prisma.clinicPatient.findMany({
                where,
                select: KONSULTA_PATIENT_SELECT,
                orderBy: [
                    { Patient: { lastName: "asc" } },
                    { Patient: { firstName: "asc" } },
                ],
                skip: page.skip,
                take: page.take,
            }),
            prisma.clinicPatient.count({ where }),
        ]);

        return {
            message: "Konsulta patients retrieved",
            data: {
                patients,
                total,
                skip: page.skip,
                take: page.take,
                hasMore: page.skip + patients.length < total,
            },
        };
    },
);

export const enrollPatientPhilHealthAction = withErrorHandling(
    async ({
        clinicUid,
        clinicPatientId,
        pin,
        patientType,
        memberPin,
        philSysId,
        tin,
    }: UpsertKonsultaPatientEnrollmentPayload) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");
        if (patientType !== "MM" && patientType !== "DD")
            throw new Error("Patient type must be Member or Dependent.");

        const clinicId = await resolveClinicId(clinicUid);
        const effYear = currentEffYear();
        const normalizedPin = pin.trim();
        if (!normalizedPin) throw new Error("PhilHealth PIN is required.");

        const identity = await prisma.$transaction(
            async (tx): Promise<ClinicPatientIdentity> => {
                const clinicPatient = await tx.clinicPatient.findFirst({
                    where: {
                        id: clinicPatientId,
                        clinicId,
                        isActive: true,
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        patientId: true,
                        Patient: {
                            select: {
                                id: true,
                                userId: true,
                                firstName: true,
                                lastName: true,
                                PhilHealthRecords: {
                                    where: { deletedAt: null },
                                    select: { id: true },
                                    take: 1,
                                },
                            },
                        },
                    },
                });
                if (!clinicPatient) throw new Error("Patient not found in this clinic");

                const otherRegisteredClinic = await tx.clinicPatient.findFirst({
                    where: {
                        id: { not: clinicPatient.id },
                        patientId: clinicPatient.patientId,
                        konsultaEffYear: effYear,
                        konsultaRegistrationStatus: "REGISTERED",
                        isActive: true,
                        deletedAt: null,
                    },
                    select: { Clinic: { select: { name: true } } },
                });
                if (otherRegisteredClinic) {
                    throw new Error(
                        `Patient is already registered to ${otherRegisteredClinic.Clinic.name} for ${effYear}.`,
                    );
                }

                const existingRecord = clinicPatient.Patient.PhilHealthRecords[0];
                if (existingRecord) {
                    try {
                        await tx.philHealthRecord.update({
                            where: { id: existingRecord.id },
                            data: {
                                pin: normalizedPin,
                                philSysId: philSysId?.trim() || null,
                                tin: tin?.trim() || null,
                            },
                        });
                    } catch (error) {
                        if (
                            error instanceof Error &&
                            error.message.includes("Unique constraint failed")
                        ) {
                            if (error.message.includes("pin")) {
                                throw new Error(
                                    "This PhilHealth PIN is already registered to another patient.",
                                );
                            }
                        }
                        throw error;
                    }
                } else {
                    try {
                        await tx.philHealthRecord.create({
                            data: {
                                userId: clinicPatient.Patient.id,
                                pin: normalizedPin,
                                memberTypeId: await resolveDefaultMemberTypeId(tx),
                                philSysId: philSysId?.trim() || null,
                                tin: tin?.trim() || null,
                            },
                        });
                    } catch (error) {
                        if (
                            error instanceof Error &&
                            error.message.includes("Unique constraint failed")
                        ) {
                            if (error.message.includes("pin")) {
                                throw new Error(
                                    "This PhilHealth PIN is already registered to another patient.",
                                );
                            }
                        }
                        throw error;
                    }
                }

                await tx.clinicPatient.update({
                    where: { id: clinicPatient.id },
                    data: {
                        konsultaPatientType: patientType,
                        konsultaMemberPin:
                            patientType === "MM" ? normalizedPin : memberPin?.trim() || null,
                        konsultaEffYear: effYear,
                        konsultaRegistrationStatus: "PENDING",
                        konsultaRegistrationCheckedAt: null,
                        konsultaRegistrationResult: Prisma.DbNull,
                        konsultaUnenrolledAt: null,
                    },
                });

                return {
                    clinicPatientId: clinicPatient.id,
                    userId: clinicPatient.Patient.id,
                    userUid: clinicPatient.Patient.userId,
                    patientName:
                        `${clinicPatient.Patient.firstName ?? ""} ${clinicPatient.Patient.lastName ?? ""}`.trim(),
                    pin: normalizedPin,
                    patientType,
                };
            },
        );

        let registrationStatus = "FAILED";
        let registrationResult: Prisma.InputJsonObject;
        try {
            const token = await getKonsultaTokenForClinic(clinicId);
            console.log({ token });
            const { isMemberDependentRegistered } = await import(
                "@/services/konsulta/konsulta-soap.service"
            );
            const raw = await isMemberDependentRegistered(
                { pPIN: identity.pin, pType: identity.patientType },
                token,
            );
            console.log({ identity, raw });
            registrationResult = parseSoapReturn(raw.return);
            registrationStatus = isAffirmativeSoapResult(registrationResult)
                ? "REGISTERED"
                : "NOT_REGISTERED";
        } catch (error) {
            console.log({ error });
            registrationResult = {
                error: error instanceof Error ? error.message : String(error),
            };
        }

        await prisma.clinicPatient.update({
            where: { id: identity.clinicPatientId },
            data: {
                konsultaRegistrationStatus: registrationStatus,
                konsultaRegisteredAt:
                    registrationStatus === "REGISTERED" ? new Date() : null,
                konsultaRegistrationCheckedAt: new Date(),
                konsultaRegistrationResult: registrationResult,
            },
        });

        return {
            message:
                registrationStatus === "REGISTERED"
                    ? "Patient is registered to this Konsulta provider."
                    : "Patient details saved, but PhilHealth did not confirm registration to this provider.",
            data: { ...identity, registrationStatus, registrationResult },
        };
    },
);

export const unenrollKonsultaPatientAction = withErrorHandling(
    async ({
        clinicUid,
        clinicPatientId,
    }: {
        clinicUid: string;
        clinicPatientId: number;
    }) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);
        await prisma.clinicPatient.updateMany({
            where: { id: clinicPatientId, clinicId, isActive: true, deletedAt: null },
            data: {
                konsultaRegistrationStatus: "UNENROLLED",
                konsultaRegisteredAt: null,
                konsultaUnenrolledAt: new Date(),
            },
        });

        return {
            message: "Patient removed from this clinic's Konsulta enrolled list",
            data: null,
        };
    },
);

export const checkKonsultaPatientRegistrationAction = withErrorHandling(
    async ({
        clinicUid,
        clinicPatientId,
    }: {
        clinicUid: string;
        clinicPatientId: number;
    }) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);
        const patient = await prisma.clinicPatient.findFirst({
            where: { id: clinicPatientId, clinicId, isActive: true, deletedAt: null },
            select: {
                id: true,
                konsultaPatientType: true,
                Patient: {
                    select: {
                        PhilHealthRecords: {
                            where: { deletedAt: null },
                            select: { pin: true },
                            take: 1,
                        },
                    },
                },
            },
        });
        if (!patient) throw new Error("Patient not found in this clinic");
        const pin = patient.Patient.PhilHealthRecords[0]?.pin;
        const patientType =
            patient.konsultaPatientType as KonsultaPatientType | null;
        if (!pin || !patientType)
            throw new Error(
                "PhilHealth PIN and patient type are required before checking registration.",
            );

        const token = await getKonsultaTokenForClinic(clinicId);
        const { isMemberDependentRegistered } = await import(
            "@/services/konsulta/konsulta-soap.service"
        );
        const raw = await isMemberDependentRegistered(
            { pPIN: pin, pType: patientType },
            token,
        );
        const registrationResult = parseSoapReturn(raw.return);
        const registrationStatus = isAffirmativeSoapResult(registrationResult)
            ? "REGISTERED"
            : "NOT_REGISTERED";

        await prisma.clinicPatient.update({
            where: { id: patient.id },
            data: {
                konsultaEffYear: currentEffYear(),
                konsultaRegistrationStatus: registrationStatus,
                konsultaRegisteredAt:
                    registrationStatus === "REGISTERED" ? new Date() : null,
                konsultaRegistrationCheckedAt: new Date(),
                konsultaRegistrationResult: registrationResult,
            },
        });

        return {
            message: "Konsulta registration checked",
            data: { registrationStatus, registrationResult },
        };
    },
);

export const checkEnrolledPatientsRegistrationBatchAction = withErrorHandling(
    async ({
        clinicUid,
        clinicPatientIds,
    }: {
        clinicUid: string;
        clinicPatientIds?: number[];
    }) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);
        const effYear = currentEffYear();

        // Fetch all enrolled patients (or filtered by IDs)
        const enrolledPatients = await prisma.clinicPatient.findMany({
            where: {
                clinicId,
                isActive: true,
                deletedAt: null,
                konsultaEffYear: effYear,
                konsultaRegistrationStatus: "REGISTERED",
                ...(clinicPatientIds ? { id: { in: clinicPatientIds } } : {}),
            },
            select: {
                id: true,
                konsultaPatientType: true,
                Patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        PhilHealthRecords: {
                            where: { deletedAt: null },
                            select: { pin: true },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (enrolledPatients.length === 0) {
            return {
                message: "No enrolled patients found to check",
                data: { checked: 0, valid: 0, invalid: 0, failed: 0, results: [] },
            };
        }

        const token = await getKonsultaTokenForClinic(clinicId);
        const { isMemberDependentRegistered } = await import(
            "@/services/konsulta/konsulta-soap.service"
        );
        const results: Array<{
            clinicPatientId: number;
            patientName: string;
            status: "REGISTERED" | "NOT_REGISTERED" | "ERROR";
            message: string;
        }> = [];

        let validCount = 0;
        let invalidCount = 0;
        let failedCount = 0;

        for (const patient of enrolledPatients) {
            try {
                const pin = patient.Patient.PhilHealthRecords[0]?.pin;
                const patientType =
                    patient.konsultaPatientType as KonsultaPatientType | null;

                if (!pin || !patientType) {
                    failedCount++;
                    results.push({
                        clinicPatientId: patient.id,
                        patientName:
                            `${patient.Patient.firstName ?? ""} ${patient.Patient.lastName ?? ""}`.trim(),
                        status: "ERROR",
                        message: "Missing PhilHealth PIN or patient type",
                    });
                    continue;
                }

                const raw = await isMemberDependentRegistered(
                    { pPIN: pin, pType: patientType },
                    token,
                );
                const registrationResult = parseSoapReturn(raw.return);
                const registrationStatus = isAffirmativeSoapResult(registrationResult)
                    ? "REGISTERED"
                    : "NOT_REGISTERED";

                await prisma.clinicPatient.update({
                    where: { id: patient.id },
                    data: {
                        konsultaRegistrationStatus: registrationStatus,
                        konsultaRegisteredAt:
                            registrationStatus === "REGISTERED" ? new Date() : null,
                        konsultaRegistrationCheckedAt: new Date(),
                        konsultaRegistrationResult: registrationResult,
                    },
                });

                if (registrationStatus === "REGISTERED") {
                    validCount++;
                } else {
                    invalidCount++;
                }

                results.push({
                    clinicPatientId: patient.id,
                    patientName:
                        `${patient.Patient.firstName ?? ""} ${patient.Patient.lastName ?? ""}`.trim(),
                    status: registrationStatus,
                    message:
                        registrationStatus === "REGISTERED"
                            ? "Patient is registered to this Konsulta provider"
                            : "Patient is not registered to this Konsulta provider",
                });
            } catch (error) {
                failedCount++;
                results.push({
                    clinicPatientId: patient.id,
                    patientName:
                        `${patient.Patient.firstName ?? ""} ${patient.Patient.lastName ?? ""}`.trim(),
                    status: "ERROR",
                    message: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return {
            message: `Registration check completed for ${enrolledPatients.length} patients`,
            data: {
                checked: enrolledPatients.length,
                valid: validCount,
                invalid: invalidCount,
                failed: failedCount,
                results,
            },
        };
    },
);

type ImportKonsultaProfileInput = {
    profDate?: string;
    // Vitals (PEPERT)
    systolic?: string;
    diastolic?: string;
    hr?: string;
    rr?: string;
    temp?: string;
    height?: string;
    weight?: string;
    bmi?: string;
    zScore?: string;
    leftVision?: string;
    rightVision?: string;
    // Pediatric measurements (PEPERT)
    length?: string;
    headCirc?: string;
    skinfoldThickness?: string;
    waist?: string;
    hip?: string;
    limbs?: string;
    midUpperArmCirc?: string;
    // Social history (SOCHIST)
    isSmoker?: string;
    noCigpk?: string;
    isAdrinker?: string;
    noBottles?: string;
    illDrugUser?: string;
    isSexuallyActive?: string;
    // Menstrual history (MENSHIST)
    mensIsApplicable?: string;
    menarchePeriod?: string;
    lastMensPeriod?: string;
    periodDuration?: string;
    mensInterval?: string;
    padsPerDay?: string;
    onsetSexIc?: string;
    birthCtrlMethod?: string;
    isMenopause?: string;
    menopauseAge?: string;
    // Pregnancy history (PREGHIST)
    pregIsApplicable?: string;
    pregCnt?: string;
    deliveryCnt?: string;
    deliveryTyp?: string;
    fullTermCnt?: string;
    prematureCnt?: string;
    abortionCnt?: string;
    livChildrenCnt?: string;
    wPregIndhyp?: string;
    // Surgical histories (SURGHISTS)
    surgHists?: Array<{ desc: string; date: string }>;
};

type ImportKonsultaAssignmentInput = {
    pin: string;
    patientType: "MM" | "DD";
    memberPin?: string | null;
    firstName: string;
    lastName: string;
    middleName?: string | null;
    effYear?: string | null;
    profileData?: ImportKonsultaProfileInput | null;
};

/**
 * After a patient is successfully enrolled, reverse-map the parsed PROFILE
 * data back into the database (vitals, social history, ob-gyne, surgical hx,
 * pediatric measurements).  Non-blocking — errors are swallowed so they
 * don't roll back the enrollment.
 */
async function upsertPatientProfileFromXml(
    userId: number,
    profile: ImportKonsultaProfileInput,
): Promise<void> {
    const toFloat = (v?: string): number | undefined => {
        const n = parseFloat(v ?? "");
        return Number.isNaN(n) || n === 0 ? undefined : n;
    };
    const toInt = (v?: string): number | undefined => {
        const n = parseInt(v ?? "", 10);
        return Number.isNaN(n) || n === 0 ? undefined : n;
    };
    const yesNo = (v?: string) => (v ?? "").toUpperCase() === "Y";

    const profDate = profile.profDate ? new Date(profile.profDate) : new Date();

    // ── VitalSign ──────────────────────────────────────────────────────────
    const hasSomeVital = [
        profile.systolic, profile.diastolic, profile.hr, profile.rr,
        profile.temp, profile.height, profile.weight,
    ].some((v) => v && v.trim() !== "" && v.trim() !== "0");

    if (hasSomeVital) {
        await prisma.vitalSign.create({
            data: {
                userId,
                dateTaken: profDate,
                bpSystolic: toInt(profile.systolic),
                bpDiastolic: toInt(profile.diastolic),
                pulseRate: toInt(profile.hr),
                respRate: toInt(profile.rr),
                temp: toFloat(profile.temp),
                height: toFloat(profile.height),
                weight: toFloat(profile.weight),
                bmi: toFloat(profile.bmi),
            },
        });
    }

    // ── PediatricMeasurement ───────────────────────────────────────────────
    const hasPediatric = [
        profile.length, profile.headCirc, profile.skinfoldThickness,
        profile.waist, profile.hip, profile.limbs, profile.midUpperArmCirc,
    ].some((v) => v && v.trim() !== "" && v.trim() !== "0");

    if (hasPediatric) {
        await prisma.pediatricMeasurement.create({
            data: {
                userId,
                dateTaken: profDate,
                length: toFloat(profile.length) ?? null,
                headCircumference: toFloat(profile.headCirc) ?? null,
                skinfoldThickness: toFloat(profile.skinfoldThickness) ?? null,
                waistCircumference: toFloat(profile.waist) ?? null,
                hipCircumference: toFloat(profile.hip) ?? null,
                limbCircumference: toFloat(profile.limbs) ?? null,
                midUpperArmCircumference: toFloat(profile.midUpperArmCirc) ?? null,
            },
        });
    }

    // ── PersonalHistory (social history — upsert) ──────────────────────────
    const hasPersonal = [
        profile.isSmoker, profile.isAdrinker,
        profile.illDrugUser, profile.isSexuallyActive,
    ].some((v) => v && v.trim() !== "");

    if (hasPersonal) {
        const personalData = {
            smokingStatus: profile.isSmoker || null,
            numberOfPacksPerYear: toInt(profile.noCigpk),
            alcoholStatus: profile.isAdrinker || null,
            numberOfBottlesPerDay: toInt(profile.noBottles),
            illicitDrugUse: profile.illDrugUser || null,
            sexuallyActive: profile.isSexuallyActive || null,
        };
        await prisma.personalHistory.upsert({
            where: { userId },
            create: { userId, ...personalData },
            update: personalData,
        });
    }

    // ── ObGyneHistory (upsert) ─────────────────────────────────────────────
    const menApplicable = yesNo(profile.mensIsApplicable);
    const pregApplicable = yesNo(profile.pregIsApplicable);
    if (menApplicable || pregApplicable) {
        const lmpDate = profile.lastMensPeriod ? new Date(profile.lastMensPeriod) : undefined;
        const obData = {
            menarche: toInt(profile.menarchePeriod),
            lastMenstrualPeriod: lmpDate,
            menopauseAge: toInt(profile.menopauseAge),
            menopauseStatus: profile.isMenopause || null,
            ageAtFirstSexualIntercourse: toInt(profile.onsetSexIc),
            birthControlMethod: profile.birthCtrlMethod || null,
            menstrualPeriodDuration: toInt(profile.periodDuration),
            menstrualCycleInterval: toInt(profile.mensInterval),
            numberOfPadsPerDay: toInt(profile.padsPerDay),
            gravidity: toInt(profile.pregCnt),
            parity: toInt(profile.deliveryCnt),
            fullTerm: toInt(profile.fullTermCnt),
            premature: toInt(profile.prematureCnt),
            abortion: toInt(profile.abortionCnt),
            livingChildren: toInt(profile.livChildrenCnt),
            typeOfDelivery: profile.deliveryTyp || null,
            hasPreEclampsia: yesNo(profile.wPregIndhyp),
        };
        await prisma.obGyneHistory.upsert({
            where: { userId },
            create: { userId, ...obData },
            update: obData,
        });
    }

    // ── SurgicalHistory ────────────────────────────────────────────────────
    if (profile.surgHists && profile.surgHists.length > 0) {
        for (const sh of profile.surgHists) {
            if (!sh.desc) continue;
            const surgDate = sh.date ? new Date(sh.date) : undefined;
            await prisma.surgicalHistory.create({
                data: {
                    userId,
                    operationName: sh.desc,
                    operationDate: surgDate,
                },
            });
        }
    }
}

export const importKonsultaAssignmentsAction = withErrorHandling(
    async ({
        clinicUid,
        assignments,
    }: {
        clinicUid: string;
        assignments: ImportKonsultaAssignmentInput[];
    }) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        if (assignments.length === 0) {
            return {
                message: "No assignments to import",
                data: {
                    imported: 0,
                    rejected: 0,
                    results: [] as Array<{
                        pin: string;
                        status: "IMPORTED" | "REJECTED";
                        reason: string;
                    }>,
                },
            };
        }

        const clinicId = await resolveClinicId(clinicUid);
        const currentYear = currentEffYear();

        const results: Array<{
            pin: string;
            status: "IMPORTED" | "REJECTED";
            reason: string;
        }> = [];
        let imported = 0;
        let rejected = 0;

        for (const assignment of assignments) {
            const pin = assignment.pin.trim();
            if (!pin) {
                rejected++;
                results.push({
                    pin: assignment.pin,
                    status: "REJECTED",
                    reason: "Missing assigned PIN",
                });
                continue;
            }

            if (
                assignment.patientType === "DD" &&
                !(assignment.memberPin ?? "").trim()
            ) {
                rejected++;
                results.push({
                    pin,
                    status: "REJECTED",
                    reason: "Dependent assignment is missing primary member PIN",
                });
                continue;
            }

            const effectiveYear = assignment.effYear?.trim();
            if (effectiveYear && Number(effectiveYear) < Number(currentYear)) {
                rejected++;
                results.push({
                    pin,
                    status: "REJECTED",
                    reason: "Expired Konsulta membership",
                });
                continue;
            }

            const normalizedMemberPin =
                assignment.patientType === "DD"
                    ? (assignment.memberPin ?? "").trim()
                    : pin;

            let clinicPatientId: number | null = null;

            const existingClinicPatient = await prisma.clinicPatient.findFirst({
                where: {
                    clinicId,
                    Patient: {
                        PhilHealthRecords: {
                            some: {
                                deletedAt: null,
                                pin,
                            },
                        },
                    },
                },
                select: { id: true, isActive: true, deletedAt: true, patientId: true },
            });

            let enrolledUserId: number | null = null;

            if (existingClinicPatient) {
                if (
                    !existingClinicPatient.isActive ||
                    existingClinicPatient.deletedAt
                ) {
                    await prisma.clinicPatient.update({
                        where: { id: existingClinicPatient.id },
                        data: { isActive: true, deletedAt: null },
                    });
                }
                clinicPatientId = existingClinicPatient.id;
                enrolledUserId = existingClinicPatient.patientId;
            } else {
                const philHealthRecord = await prisma.philHealthRecord.findFirst({
                    where: { pin, deletedAt: null, User: { isActive: true } },
                    select: {
                        userId: true,
                        User: {
                            select: { firstName: true, lastName: true, middleName: true },
                        },
                    },
                });

                if (!philHealthRecord) {
                    rejected++;
                    results.push({
                        pin,
                        status: "REJECTED",
                        reason: "Patient profile with this PIN does not exist in system",
                    });
                    continue;
                }

                const addedClinicPatient = await prisma.clinicPatient.create({
                    data: {
                        clinicId,
                        patientId: philHealthRecord.userId,
                        konsultaEffYear: currentYear,
                    },
                    select: { id: true },
                });

                clinicPatientId = addedClinicPatient.id;
                enrolledUserId = philHealthRecord.userId;
            }

            const enrollment = await enrollPatientPhilHealthAction({
                clinicUid,
                clinicPatientId,
                pin,
                patientType: assignment.patientType,
                memberPin: normalizedMemberPin,
                philSysId: null,
                tin: null,
            });

            if (enrollment.status) {
                imported++;
                results.push({
                    pin,
                    status: "IMPORTED",
                    reason: "Imported and enrolled",
                });

                // Reverse-map PROFILE data into the patient's health records.
                // Run outside the main try/catch so a profile-write failure
                // doesn't roll back the successful enrollment.
                if (assignment.profileData && enrolledUserId !== null) {
                    try {
                        await upsertPatientProfileFromXml(enrolledUserId, assignment.profileData);
                    } catch {
                        // Profile sync failure is non-fatal — enrollment still counts.
                    }
                }
            } else {
                rejected++;
                results.push({
                    pin,
                    status: "REJECTED",
                    reason: enrollment.message ?? "Enrollment failed",
                });
            }
        }

        return {
            message: `Imported ${imported} assignment(s); rejected ${rejected}`,
            data: { imported, rejected, results },
        };
    },
);

// ─── Consultations ────────────────────────────────────────────────────────────

export type PhilHealthConsultationsParams = {
    clinicUid: string;
    from?: Date;
    to?: Date;
};

/** Returns consultations belonging to PhilHealth-enrolled patients. */
export const getPhilHealthConsultationsAction = withErrorHandling(
    async ({ clinicUid, from, to }: PhilHealthConsultationsParams) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);

        const effYear = currentEffYear();

        // Resolve registered clinic patient IDs first to avoid filtering through
        // a nullable relation (clinicPatientId is optional on ConsultationTicket).
        const enrolledClinicPatients = await prisma.clinicPatient.findMany({
            where: {
                clinicId,
                isActive: true,
                deletedAt: null,
                konsultaEffYear: effYear,
                konsultaRegistrationStatus: "REGISTERED",
            },
            select: { id: true, patientId: true },
        });

        if (enrolledClinicPatients.length === 0) {
            return { message: "No enrolled PhilHealth patients", data: [] };
        }

        const enrolledIds = enrolledClinicPatients.map((cp) => cp.id);
        const enrolledPatientUserIds = enrolledClinicPatients.map(
            (cp) => cp.patientId,
        );

        const dateFilter = from && to ? { gte: from, lte: to } : undefined;
        console.log({ clinicId, enrolledIds, enrolledPatientUserIds, dateFilter });
        const consultations = await prisma.consultationTicket.findMany({
            where: {
                clinicId,
                isActive: true,
                isArchived: false,
                createdAt: dateFilter,
                OR: [
                    // New way: Direct clinicPatientId link to enrolled patient
                    { clinicPatientId: { in: enrolledIds } },
                    // Old way: Through appointment to enrolled patient (via AppointmentRequester)
                    {
                        Appointment: {
                            Requesters: {
                                some: {
                                    userId: { in: enrolledPatientUserIds },
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                caseNumber: true,
                konsultaHciCaseNo: true,
                konsultaHciTransNo: true,
                konsultaAtc: true,
                konsultaAtcValidationStatus: true,
                konsultaAtcValidatedAt: true,
                createdAt: true,
                clinicPatientId: true,
                Appointment: {
                    select: {
                        id: true,
                        AppointmentAttribute: { select: { date: true, isWalkIn: true } },
                        Requesters: {
                            select: {
                                User: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        dob: true,
                                        gender: true,
                                        PhilHealthRecords: {
                                            where: { deletedAt: null },
                                            select: {
                                                pin: true,
                                                PhilHealthMemberType: { select: { name: true } },
                                            },
                                            take: 1,
                                        },
                                    },
                                },
                            },
                            take: 1,
                        },
                    },
                },
                ClinicPatient: {
                    select: {
                        id: true,
                        konsultaEffYear: true,
                        konsultaRegistrationStatus: true,
                        konsultaPatientType: true,
                        konsultaMemberPin: true,
                        Patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                dob: true,
                                gender: true,
                                PhilHealthRecords: {
                                    where: { deletedAt: null },
                                    select: {
                                        pin: true,
                                        PhilHealthMemberType: { select: { name: true } },
                                    },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                ConsultationTicketAttribute: {
                    select: { status: true },
                },
                ConsultationDiagnoses: {
                    select: { icd10Code: true, description: true, type: true },
                    take: 3,
                },
                Prescriptions: {
                    where: { isActive: true, isArchived: false },
                    select: { id: true, transactionNumber: true },
                },
                ConsultationTicketHPs: {
                    select: {
                        HealthCareProvider: {
                            select: {
                                User: { select: { firstName: true, lastName: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        // Additional filter: ensure consultations from both paths are from registered patients
        const filteredConsultations = consultations.filter((c) => {
            if (c.clinicPatientId && c.ClinicPatient) {
                // Direct clinicPatientId path: verify enrollment
                return (
                    c.ClinicPatient.konsultaEffYear === effYear &&
                    c.ClinicPatient.konsultaRegistrationStatus === "REGISTERED"
                );
            }
            // For appointment path, the WHERE clause already verified the patient is enrolled
            // but ClinicPatient might be null, which is fine for old consultations
            return true;
        });

        return {
            message: "PhilHealth consultations retrieved",
            data: filteredConsultations,
        };
    },
);

export const validateKonsultaAtcAction = withErrorHandling(
    async ({
        clinicUid,
        consultationTicketId,
        atc,
    }: {
        clinicUid: string;
        consultationTicketId: number;
        atc: string;
    }) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);
        const consultation = await prisma.consultationTicket.findFirst({
            where: {
                id: consultationTicketId,
                clinicId,
                isActive: true,
                isArchived: false,
            },
            select: {
                id: true,
                createdAt: true,
                Appointment: {
                    select: { AppointmentAttribute: { select: { date: true } } },
                },
                ClinicPatient: {
                    select: {
                        Patient: {
                            select: {
                                PhilHealthRecords: {
                                    where: { deletedAt: null },
                                    select: { pin: true },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!consultation) throw new Error("Consultation not found");
        const pin = consultation.ClinicPatient?.Patient.PhilHealthRecords[0]?.pin;
        if (!pin) throw new Error("Patient has no PhilHealth PIN.");
        // Konsulta Kit 1.1 examples and service usage expect ATC token values in uppercase form.
        const normalizedAtc = atc.trim().toUpperCase();
        if (!normalizedAtc) throw new Error("ATC is required.");

        const effectivityDate = (
            consultation.Appointment?.AppointmentAttribute?.date ??
            consultation.createdAt
        )
            .toISOString()
            .slice(0, 10);
        const token = await getKonsultaTokenForClinic(clinicId);
        const { isATCValid } = await import(
            "@/services/konsulta/konsulta-soap.service"
        );
        const raw = await isATCValid(
            { pPIN: pin, pATC: normalizedAtc, pEffectivityDate: effectivityDate },
            token,
        );
        const validationResult = parseSoapReturn(raw.return);
        const validationStatus = isAffirmativeSoapResult(validationResult)
            ? "VALID"
            : "INVALID";

        await prisma.consultationTicket.update({
            where: { id: consultation.id },
            data: {
                konsultaAtc: normalizedAtc,
                konsultaAtcValidationStatus: validationStatus,
                konsultaAtcValidatedAt: new Date(),
                konsultaAtcValidationResult: validationResult,
            },
        });

        return {
            message: "ATC validation completed",
            data: { validationStatus, validationResult },
        };
    },
);

export const verifyKonsultaAtcByPinAction = withErrorHandling(
    async ({
        clinicUid,
        pin,
        atc,
        effectivityDate,
    }: {
        clinicUid: string;
        pin: string;
        atc: string;
        effectivityDate: string;
    }) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);
        const normalizedPin = pin.trim();
        const normalizedAtc = atc.trim().toUpperCase();
        const normalizedEffectivityDate = effectivityDate.trim();

        if (!normalizedPin) throw new Error("PIN is required.");
        if (!normalizedAtc) throw new Error("ATC is required.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedEffectivityDate)) {
            throw new Error("Effectivity date must be in YYYY-MM-DD format.");
        }

        const token = await getKonsultaTokenForClinic(clinicId);
        const { isATCValid } = await import(
            "@/services/konsulta/konsulta-soap.service"
        );
        const raw = await isATCValid(
            {
                pPIN: normalizedPin,
                pATC: normalizedAtc,
                pEffectivityDate: normalizedEffectivityDate,
            },
            token,
        );
        const validationResult = parseSoapReturn(raw.return);
        const validationStatus = isAffirmativeSoapResult(validationResult)
            ? "VALID"
            : "INVALID";

        return {
            message: "ATC verification completed",
            data: {
                validationStatus,
                validationResult,
                pin: normalizedPin,
                atc: normalizedAtc,
                effectivityDate: normalizedEffectivityDate,
            },
        };
    },
);

export const verifyKonsultaMemberDependentRegistrationAction =
    withErrorHandling(
        async ({
            clinicUid,
            memberType,
            memberPin,
            dependentPin,
        }: {
            clinicUid: string;
            memberType: "MM" | "DD";
            memberPin: string;
            dependentPin?: string | null;
        }) => {
            const session = await getCachedSession();
            if (!session) throw new Error("Unauthorized");

            const clinicId = await resolveClinicId(clinicUid);
            const normalizedMemberPin = memberPin.trim();
            const normalizedDependentPin = dependentPin?.trim() ?? "";
            if (!normalizedMemberPin) throw new Error("Member PIN is required.");
            if (memberType === "DD" && !normalizedDependentPin) {
                throw new Error(
                    "Dependent PIN is required when member type is Dependent.",
                );
            }

            const pinToCheck =
                memberType === "DD" ? normalizedDependentPin : normalizedMemberPin;
            const token = await getKonsultaTokenForClinic(clinicId);
            const { isMemberDependentRegistered } = await import(
                "@/services/konsulta/konsulta-soap.service"
            );
            const raw = await isMemberDependentRegistered(
                { pPIN: pinToCheck, pType: memberType },
                token,
            );
            const registrationResult = parseSoapReturn(raw.return);
            const registrationStatus = isAffirmativeSoapResult(registrationResult)
                ? "REGISTERED"
                : "NOT_REGISTERED";

            return {
                message: "Konsulta registration verification completed",
                data: {
                    registrationStatus,
                    registrationResult,
                    memberType,
                    memberPin: normalizedMemberPin,
                    dependentPin: memberType === "DD" ? normalizedDependentPin : null,
                    pinChecked: pinToCheck,
                },
            };
        },
    );

// ─── Batches ──────────────────────────────────────────────────────────────────

/** Returns all Konsulta batches for a clinic, newest first. */
export const getKonsultaBatchesAction = withErrorHandling(
    async (clinicUid: string) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);

        const batches = await prisma.konsultaBatch.findMany({
            where: { clinicId },
            select: {
                id: true,
                batchUid: true,
                period: true,
                reportTagging: true,
                transmittalNo: true,
                status: true,
                notes: true,
                xmlPayload: true,
                errorMessage: true,
                submittedAt: true,
                createdAt: true,
                updatedAt: true,
                validateResult: true,
                submitResult: true,
                CreatedByUser: {
                    select: { firstName: true, lastName: true },
                },
                KonsultaEntries: {
                    select: {
                        id: true,
                        philHealthPin: true,
                        memberPin: true,
                        memberType: true,
                        hciCaseNo: true,
                        hciTransNo: true,
                        status: true,
                        included: true,
                        consultationIds: true,
                        Patient: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return { message: "Batches retrieved", data: batches };
    },
);

/** Returns a single batch with full detail. */
export const getKonsultaBatchAction = withErrorHandling(
    async (batchUid: string) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const batch = await prisma.konsultaBatch.findUnique({
            where: { batchUid },
            select: {
                id: true,
                batchUid: true,
                clinicId: true,
                period: true,
                reportTagging: true,
                transmittalNo: true,
                status: true,
                notes: true,
                xmlPayload: true,
                validateResult: true,
                submitResult: true,
                errorMessage: true,
                submittedAt: true,
                createdAt: true,
                updatedAt: true,
                KonsultaEntries: {
                    select: {
                        id: true,
                        patientUserId: true,
                        philHealthPin: true,
                        memberPin: true,
                        memberType: true,
                        hciCaseNo: true,
                        hciTransNo: true,
                        consultationIds: true,
                        included: true,
                        status: true,
                        errorMessage: true,
                        Patient: {
                            select: {
                                firstName: true,
                                lastName: true,
                                dob: true,
                                gender: true,
                            },
                        },
                    },
                },
            },
        });
        if (!batch) throw new Error("Batch not found");

        return { message: "Batch retrieved", data: batch };
    },
);

// ─── Create Batch ─────────────────────────────────────────────────────────────

export type CreateKonsultaBatchPayload = {
    clinicUid: string;
    period: string; // "YYYYMM"
    reportTagging: "1" | "2";
    notes?: string;
    patientUserIds: number[]; // patients to include
};

export const createKonsultaBatchAction = withErrorHandling(
    async ({
        clinicUid,
        period,
        reportTagging,
        notes,
        patientUserIds,
    }: CreateKonsultaBatchPayload) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);

        if (!period.match(/^\d{6}$/)) {
            throw new Error("Period must be in YYYYMM format (e.g. 202604)");
        }
        if (patientUserIds.length === 0) {
            throw new Error("Select at least one patient for the batch.");
        }

        // Fetch PhilHealth records for selected patients
        const effYear = period.slice(0, 4);
        const credentials = await getClinicKonsultaCredentials(clinicId);

        const eligiblePatients = await prisma.clinicPatient.findMany({
            where: {
                clinicId,
                patientId: { in: patientUserIds },
                isActive: true,
                deletedAt: null,
                konsultaEffYear: effYear,
                konsultaRegistrationStatus: "REGISTERED",
                Patient: { PhilHealthRecords: { some: { deletedAt: null } } },
            },
            select: {
                id: true,
                patientId: true,
                konsultaPatientType: true,
                konsultaMemberPin: true,
                Patient: {
                    select: {
                        PhilHealthRecords: {
                            where: { deletedAt: null },
                            select: { pin: true },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (eligiblePatients.length === 0) {
            throw new Error(
                "Selected patients are not registered to this Konsulta provider for the reporting year.",
            );
        }

        const eligibleClinicPatientIds = eligiblePatients.map((p) => p.id);

        // Fetch relevant consultations for these patients in the period
        const year = parseInt(period.slice(0, 4), 10);
        const month = parseInt(period.slice(4, 6), 10) - 1;
        const periodStart = new Date(year, month, 1);
        const periodEnd = new Date(year, month + 1, 0, 23, 59, 59);

        const consultations = await prisma.consultationTicket.findMany({
            where: {
                clinicId,
                isActive: true,
                isArchived: false,
                createdAt: { gte: periodStart, lte: periodEnd },
                clinicPatientId: { in: eligibleClinicPatientIds },
            },
            select: {
                id: true,
                ClinicPatient: { select: { Patient: { select: { id: true } } } },
            },
        });

        // Group consultation IDs by patient user ID
        const consultationsByPatient = new Map<number, number[]>();
        for (const c of consultations) {
            const pid = c.ClinicPatient?.Patient?.id;
            if (!pid) continue;
            const arr = consultationsByPatient.get(pid) ?? [];
            arr.push(c.id);
            consultationsByPatient.set(pid, arr);
        }

        const entrySequences = new Map<
            number,
            { caseSequence: number; transSequence: number }
        >();
        for (const patient of eligiblePatients) {
            const transEntityType =
                reportTagging === "1"
                    ? "KONSULTA_ENLISTMENT_TRANSACTION"
                    : "KONSULTA_SOAP_TRANSACTION";
            entrySequences.set(patient.id, {
                caseSequence: await getNextSequenceNumber(
                    "KONSULTA_HCI_CASE",
                    clinicId,
                    periodStart,
                ),
                transSequence: await getNextSequenceNumber(
                    transEntityType,
                    clinicId,
                    periodStart,
                ),
            });
        }

        const batch = await prisma.$transaction(async (tx) => {
            const created = await tx.konsultaBatch.create({
                data: {
                    clinicId,
                    period,
                    reportTagging,
                    notes: notes ?? null,
                    status: "DRAFT",
                    createdBy: (
                        await tx.user.findFirst({
                            where: { userId: session.user.sub },
                            select: { id: true },
                        })
                    )?.id,
                },
            });

            // Build entries
            const entries = eligiblePatients.map((patient) => {
                const pin = patient.Patient.PhilHealthRecords[0]?.pin ?? "";
                const memberType = (
                    patient.konsultaPatientType === "DD" ? "DD" : "MM"
                ) as KonsultaPatientType;
                const sequence = entrySequences.get(patient.id);
                return {
                    batchId: created.id,
                    patientUserId: patient.patientId,
                    philHealthPin: pin,
                    memberPin: memberType === "MM" ? pin : patient.konsultaMemberPin,
                    memberType,
                    hciCaseNo: formatKonsultaHciNumber(
                        "T",
                        credentials.hciAccreNo,
                        sequence?.caseSequence ?? patient.id,
                        periodStart,
                    ),
                    hciTransNo: formatKonsultaHciNumber(
                        reportTagging === "1" ? "E" : "S",
                        credentials.hciAccreNo,
                        sequence?.transSequence ?? patient.id,
                        periodStart,
                    ),
                    consultationIds: consultationsByPatient.get(patient.patientId) ?? [],
                    included: true,
                    status: pin ? "PENDING" : "FAILED",
                    errorMessage: pin ? null : "No PhilHealth PIN found",
                };
            });

            await tx.konsultaEntry.createMany({ data: entries });

            return created;
        });

        return {
            message: "Batch created successfully",
            data: { batchUid: batch.batchUid },
        };
    },
);

// ─── Toggle Entry Inclusion ───────────────────────────────────────────────────

export const toggleKonsultaEntryAction = withErrorHandling(
    async ({ entryId, included }: { entryId: number; included: boolean }) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        await prisma.konsultaEntry.update({
            where: { id: entryId },
            data: { included },
        });

        return { message: "Entry updated", data: null };
    },
);

// ─── Delete Batch ─────────────────────────────────────────────────────────────

export const deleteKonsultaBatchAction = withErrorHandling(
    async (batchUid: string) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const batch = await prisma.konsultaBatch.findUnique({
            where: { batchUid },
            select: { id: true, status: true },
        });
        if (!batch) throw new Error("Batch not found");
        if (batch.status === "SUBMITTED") {
            throw new Error("Cannot delete a submitted batch.");
        }

        await prisma.konsultaBatch.delete({ where: { batchUid } });

        return { message: "Batch deleted", data: null };
    },
);

// ─── Generate XML Helpers ─────────────────────────────────────────────────────

/** Map Prisma BloodType enum to PhilHealth display string (e.g. "B+"). */
function mapBloodType(bloodType: string | null | undefined): string {
    const map: Record<string, string> = {
        A_POSITIVE: "A+",
        A_NEGATIVE: "A-",
        B_POSITIVE: "B+",
        B_NEGATIVE: "B-",
        AB_POSITIVE: "AB+",
        AB_NEGATIVE: "AB-",
        O_POSITIVE: "O+",
        O_NEGATIVE: "O-",
        RH_POSITIVE: "Rh+",
        RH_NEGATIVE: "Rh-",
    };
    return bloodType ? (map[bloodType] ?? "") : "";
}

function mapSmokerStatus(status: string | null | undefined): KonsultaYN {
    return status === "CURRENT" || status === "FORMER" ? "Y" : "N";
}

function mapDrinkerStatus(status: string | null | undefined): KonsultaYN {
    return status && status !== "NEVER" ? "Y" : "N";
}

function mapDrugStatus(status: string | null | undefined): KonsultaYN {
    return status === "CURRENT" || status === "FORMER" ? "Y" : "N";
}

function mapSexuallyActiveStatus(
    status: string | null | undefined,
): KonsultaYN {
    return status === "YES" ? "Y" : "N";
}

// ─── Generate XML ─────────────────────────────────────────────────────────────

export const generateBatchXmlAction = withErrorHandling(
    async (batchUid: string) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const batch = await prisma.konsultaBatch.findUnique({
            where: { batchUid },
            select: {
                batchUid: true,
                id: true,
                clinicId: true,
                period: true,
                reportTagging: true,
                transmittalNo: true,
                status: true,
                xmlPayload: true,
                validateResult: true,
                submitResult: true,
                errorMessage: true,
                KonsultaEntries: {
                    where: { included: true },
                    select: {
                        id: true,
                        batchId: true,
                        patientUserId: true,
                        philHealthPin: true,
                        memberPin: true,
                        memberType: true,
                        hciCaseNo: true,
                        hciTransNo: true,
                        consultationIds: true,
                        status: true,
                        included: true,
                        Patient: {
                            select: {
                                id: true,
                                userId: true,
                                firstName: true,
                                lastName: true,
                                middleName: true,
                                suffix: true,
                                dob: true,
                                gender: true,
                                mobile: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    if (!batch) throw new Error("Batch not found");
    if (batch.status === "SUBMITTED") throw new Error("Batch already submitted.");

    // Validate that entries exist
    if (batch.KonsultaEntries.length === 0) {
        throw new Error("No patients selected for this batch.");
    }

    // Validate patient profiles have required information
    for (const entry of batch.KonsultaEntries) {
        const p = entry.Patient;
        if (!p.firstName || !p.lastName) {
            throw new Error(`Patient ${p.id} is missing required name information (First Name and Last Name).`);
        }
        if (!p.dob) {
            throw new Error(`Patient ${p.firstName} ${p.lastName} is missing date of birth.`);
        }
        if (!p.gender) {
            throw new Error(`Patient ${p.firstName} ${p.lastName} is missing gender information.`);
        }
        if (!entry.philHealthPin) {
            throw new Error(`Patient ${p.firstName} ${p.lastName} is missing PhilHealth PIN.`);
        }
        if (!entry.memberType || (entry.memberType !== "MM" && entry.memberType !== "DD")) {
            throw new Error(`Patient ${p.firstName} ${p.lastName} is missing or has invalid member type. Must be MM or DD.`);
        }
    }

    try {
        const credentials = await getClinicKonsultaCredentials(batch.clinicId);
        const seq = Math.floor(Date.now() / 1000) % 99999;
        const transmittalNo = generateTransmittalNumber(
            credentials.hciAccreNo,
            seq,
        );

        const year = batch.period.slice(0, 4);
        const monthIdx = parseInt(batch.period.slice(4, 6), 10) - 1;
        const periodDate = new Date(parseInt(year, 10), monthIdx, 1);
        const effYear = year;

        const enlistments: KonsultaEnlistmentData[] = batch.KonsultaEntries.map(
            (entry) => {
                const p = entry.Patient;
                const dob = p.dob ? p.dob.toISOString().slice(0, 10) : "1990-01-01";
                const mobile = p.mobile ?? `09${entry.philHealthPin.slice(-9)}`;
                const transDate = periodDate.toISOString().slice(0, 10);
                const patientType = (entry.memberType ?? "").trim() as "MM" | "DD";

                // For MM (member): pMemPin is the patient's own PIN
                // For DD (dependent): pMemPin is the member's PIN that they're dependent under
                const memberPin =
                    patientType === "MM"
                        ? entry.philHealthPin
                        : entry.memberPin || entry.philHealthPin;

                return {
                    pHciCaseNo:
                        entry.hciCaseNo ||
                        formatKonsultaHciNumber(
                            "T",
                            credentials.hciAccreNo,
                            entry.id,
                            periodDate,
                        ),
                    pHciTransNo:
                        entry.hciTransNo ||
                        formatKonsultaHciNumber(
                            "E",
                            credentials.hciAccreNo,
                            entry.id,
                            periodDate,
                        ),
                    pEffYear: effYear,
                    pEnlistStat: "1",
                    pEnlistDate: transDate,
                    pPackageType: "K",
                    pMemPin: memberPin,
                    pMemFname: p.firstName ?? "",
                    pMemMname: p.middleName ?? "",
                    pMemLname: p.lastName ?? "",
                    pMemExtname: p.suffix ?? "",
                    pMemDob: dob,
                    pPatientPin: entry.philHealthPin,
                    pPatientFname: p.firstName ?? "",
                    pPatientMname: p.middleName ?? "",
                    pPatientLname: p.lastName ?? "",
                    pPatientExtname: p.suffix ?? "",
                    pPatientSex: (p.gender === "FEMALE" ? "F" : "M") as "M" | "F",
                    pPatientDob: dob,
                    pPatientType: patientType,
                    pPatientMobileNo: mobile,
                    pPatientLandlineNo: "",
                    pWithConsent: "Y",
                    pTransDate: transDate,
                    pCreatedBy: "ClinicEZ",
                    pReportStatus: "U",
                    pDeficiencyRemarks: "",
                };
            },
        );

        // Helper function to format age like PhilHealth expects
        const formatAge = (dob: string): string => {
            if (!dob) return "0 YR(S), 0 MO(S), 0 DAY(S)";
            const d = new Date(dob);
            const now = new Date();
            let y = now.getFullYear() - d.getFullYear();
            let m = now.getMonth() - d.getMonth();
            let days = now.getDate() - d.getDate();
            if (days < 0) {
                m--;
                days += 30;
            }
            if (m < 0) {
                y--;
                m += 12;
            }
            return `${y} YR(S), ${m} MO(S), ${days} DAY(S)`;
        };

        const createPhysicalExamFindingRecord = (
            domainKey: string | null,
            mappedCode: string | null,
        ) => {
            if (!domainKey || !mappedCode) {
                return null;
            }

            return {
                pSkinId: domainKey === "lib_skin_extremities" ? mappedCode : "",
                pHeentId: domainKey === "lib_heent" ? mappedCode : "",
                pChestId: domainKey === "lib_chest" ? mappedCode : "",
                pHeartId: domainKey === "lib_heart" ? mappedCode : "",
                pAbdomenId: domainKey === "lib_abdomen" ? mappedCode : "",
                pNeuroId: domainKey === "lib_neuro" ? mappedCode : "",
                pGuId: domainKey === "lib_genitourinary" ? mappedCode : "",
                pRectalId: domainKey === "lib_digital_rectal" ? mappedCode : "",
                pReportStatus: "U" as const,
                pDeficiencyRemarks: "",
            };
        };

        const createImmunizationRecord = (
            domainKey: string | null,
            mappedCode: string | null,
        ) => {
            if (!domainKey || !mappedCode) {
                return null;
            }

            return {
                pChildImmcode: domainKey === "lib_immchild" ? mappedCode : "",
                pYoungwImmcode: domainKey === "lib_immyoungw" ? mappedCode : "",
                pPregwImmcode: domainKey === "lib_immpregw" ? mappedCode : "",
                pElderlyImmcode: domainKey === "lib_immelderly" ? mappedCode : "",
                pOtherImm: "",
                pReportStatus: "U" as const,
                pDeficiencyRemarks: "",
            };
        };
        type KonsultaGeneratedPhysicalExamFinding = NonNullable<
            ReturnType<typeof createPhysicalExamFindingRecord>
        >;
        type KonsultaGeneratedImmunization = NonNullable<
            ReturnType<typeof createImmunizationRecord>
        >;

        // For SOAPS: fetch consultation records for second-tranche reports
        const entryByConsultationId = new Map<
            number,
            (typeof batch.KonsultaEntries)[number]
        >();
        const entryByPatientUserId = new Map<
            number,
            (typeof batch.KonsultaEntries)[number]
        >();
        for (const entry of batch.KonsultaEntries) {
            entryByPatientUserId.set(entry.patientUserId, entry);
            for (const consultationId of entry.consultationIds) {
                entryByConsultationId.set(consultationId, entry);
            }
        }
        const consultationIds = Array.from(entryByConsultationId.keys());
        const patientUserIds = batch.KonsultaEntries.map(
            (entry) => entry.patientUserId,
        );

        const [
            diagnosisMappingResult,
            diagnosticMappingResult,
            managementMappingResult,
            medicineMappingResult,
            medicalHistoryMappingResult,
            immunizationMappingResult,
            physicalExamMappingResult,
            patientProfiles,
        ] = await Promise.all([
            resolveMappedIcdCodesForConsultations(batch.clinicId, consultationIds),
            resolveMappedDiagnosticsForConsultations(batch.clinicId, consultationIds),
            resolveMappedManagementForConsultations(batch.clinicId, consultationIds),
            resolveMappedMedicinesForConsultations(batch.clinicId, consultationIds),
            resolveMappedMedicalHistoryForPatients(batch.clinicId, patientUserIds),
            resolveMappedImmunizationsForPatients(batch.clinicId, patientUserIds),
            resolveMappedPhysicalExamFindingsForConsultations(
                batch.clinicId,
                consultationIds,
            ),
            prisma.user.findMany({
                where: { id: { in: patientUserIds } },
                select: {
                    id: true,
                    bloodType: true,
                    PersonalHistory: {
                        select: {
                            smokingStatus: true,
                            numberOfPacksPerYear: true,
                            alcoholStatus: true,
                            numberOfBottlesPerDay: true,
                            illicitDrugUse: true,
                            sexuallyActive: true,
                        },
                    },
                    ObGyneHistory: {
                        select: {
                            menarche: true,
                            lastMenstrualPeriod: true,
                            menopauseAge: true,
                            menopauseStatus: true,
                            ageAtFirstSexualIntercourse: true,
                            birthControlMethod: true,
                            menstrualPeriodDuration: true,
                            menstrualCycleInterval: true,
                            numberOfPadsPerDay: true,
                            gravidity: true,
                            parity: true,
                            fullTerm: true,
                            premature: true,
                            abortion: true,
                            livingChildren: true,
                            typeOfDelivery: true,
                            hasPreEclampsia: true,
                        },
                    },
                    MedicalHistories: {
                        select: {
                            details: true,
                            Condition: { select: { name: true } },
                        },
                    },
                    SurgicalHistories: {
                        where: { deletedAt: null },
                        select: { operationName: true, operationDate: true },
                    },
                    FamilyMedicalHistories: {
                        where: { deletedAt: null },
                        select: {
                            details: true,
                            Condition: { select: { name: true } },
                        },
                    },
                    VitalSigns: {
                        where: { deletedAt: null, isActive: true },
                        orderBy: { dateTaken: "desc" },
                        take: 5,
                        select: {
                            dateTaken: true,
                            bpSystolic: true,
                            bpDiastolic: true,
                            pulseRate: true,
                            respRate: true,
                            temp: true,
                            height: true,
                            weight: true,
                            bmi: true,
                        },
                    },
                    PhysicalExaminations: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: { visualAcuityLeft: true, visualAcuityRight: true },
                    },
                    PediatricMeasurements: {
                        where: { deletedAt: null },
                        orderBy: { dateTaken: "desc" },
                        take: 5,
                        select: {
                            dateTaken: true,
                            length: true,
                            headCircumference: true,
                            skinfoldThickness: true,
                            waistCircumference: true,
                            hipCircumference: true,
                            limbCircumference: true,
                            midUpperArmCircumference: true,
                        },
                    },
                },
            }),
        ]);

        const patientProfileMap = new Map(patientProfiles.map((p) => [p.id, p]));

        if (diagnosisMappingResult.deficiencies.length > 0) {
            const message = diagnosisMappingResult.deficiencies
                .slice(0, MAX_DEFICIENCY_MESSAGES_TO_DISPLAY)
                .join("\n");
            throw new Error(
                `Konsulta library mapping is incomplete for this batch.\n${message}`,
            );
        }

        const mappedIcdCodesByConsultationId =
            diagnosisMappingResult.mappedDiagnoses.reduce<Map<number, string[]>>(
                (result, diagnosis) => {
                    pushUniqueMappedCode(
                        result,
                        diagnosis.consultationId,
                        diagnosis.mappedCode,
                    );
                    return result;
                },
                new Map<number, string[]>(),
            );
        const mappedDiagnosticsByConsultationId =
            diagnosticMappingResult.mappedDiagnostics.reduce<Map<number, string[]>>(
                (result, diagnostic) => {
                    pushUniqueMappedCode(
                        result,
                        diagnostic.consultationId,
                        diagnostic.mappedCode,
                    );
                    return result;
                },
                new Map<number, string[]>(),
            );
        const mappedManagementByConsultationId =
            managementMappingResult.mappedManagements.reduce<Map<number, string[]>>(
                (result, management) => {
                    pushUniqueMappedCode(
                        result,
                        management.consultationId,
                        management.mappedCode,
                    );
                    return result;
                },
                new Map<number, string[]>(),
            );
        const mappedMedicalHistoryByPatientId =
            medicalHistoryMappingResult.mappedMedicalHistory.reduce<Map<number, string[]>>(
                (result, history) => {
                    pushUniqueMappedCode(
                        result,
                        history.patientUserId,
                        history.mappedCode,
                    );
                    return result;
                },
                new Map<number, string[]>(),
            );
        const mappedImmunizationsByPatientId =
            immunizationMappingResult.mappedImmunizations.reduce<
                Map<number, KonsultaGeneratedImmunization[]>
            >((result, immunization) => {
                const record = createImmunizationRecord(
                    immunization.domainKey,
                    immunization.mappedCode,
                );
                if (!record) {
                    return result;
                }
                const existing = result.get(immunization.patientUserId) ?? [];
                existing.push(record);
                result.set(immunization.patientUserId, existing);
                return result;
            }, new Map<number, KonsultaGeneratedImmunization[]>());
        const mappedPhysicalExamFindingsByConsultationId =
            physicalExamMappingResult.mappedFindings.reduce<
                Map<number, KonsultaGeneratedPhysicalExamFinding[]>
            >((result, finding) => {
                const record = createPhysicalExamFindingRecord(
                    finding.domainKey,
                    finding.mappedCode,
                );
                if (!record) {
                    return result;
                }
                const existing = result.get(finding.consultationId) ?? [];
                existing.push(record);
                result.set(finding.consultationId, existing);
                return result;
            }, new Map<number, KonsultaGeneratedPhysicalExamFinding[]>());

        const generatedDeficiencies: StructuredKonsultaBatchDeficiency[] = [];
        const pushConsultationDeficiency = (
            domainKey: keyof typeof GENERATED_DEFICIENCY_DOMAIN_LABELS,
            consultationId: number,
            itemLabel: string,
            message: string,
        ) => {
            const entry = entryByConsultationId.get(consultationId);
            if (!entry) {
                return;
            }

            generatedDeficiencies.push({
                domainKey,
                domainLabel: GENERATED_DEFICIENCY_DOMAIN_LABELS[domainKey],
                batchEntryId: entry.id,
                patientUserId: entry.patientUserId,
                patientName: formatBatchEntryPatientName(entry),
                philHealthPin: entry.philHealthPin,
                consultationId,
                itemLabel,
                message,
            });
        };
        const pushPatientDeficiency = (
            domainKey: keyof typeof GENERATED_DEFICIENCY_DOMAIN_LABELS,
            patientUserId: number,
            itemLabel: string,
            message: string,
        ) => {
            const entry = entryByPatientUserId.get(patientUserId);
            if (!entry) {
                return;
            }

            generatedDeficiencies.push({
                domainKey,
                domainLabel: GENERATED_DEFICIENCY_DOMAIN_LABELS[domainKey],
                batchEntryId: entry.id,
                patientUserId: entry.patientUserId,
                patientName: formatBatchEntryPatientName(entry),
                philHealthPin: entry.philHealthPin,
                consultationId: null,
                itemLabel,
                message,
            });
        };

        diagnosticMappingResult.mappedDiagnostics
            .filter((diagnostic) => diagnostic.mappedCode === null)
            .forEach((diagnostic) => {
                pushConsultationDeficiency(
                    "diagnostics",
                    diagnostic.consultationId,
                    diagnostic.inputValue,
                    `Diagnostic "${diagnostic.inputValue}" is not mapped to an active PhilHealth reference.`,
                );
            });
        managementMappingResult.mappedManagements
            .filter((management) => management.mappedCode === null)
            .forEach((management) => {
                pushConsultationDeficiency(
                    "management",
                    management.consultationId,
                    management.inputValue,
                    `Management item "${management.inputValue}" is not mapped to an active PhilHealth reference.`,
                );
            });
        medicineMappingResult.mappedMedicines
            .filter(
                (medicine) =>
                    medicine.mappedDrugCode === null &&
                    medicine.mappedGenericCode === null,
            )
            .forEach((medicine) => {
                pushConsultationDeficiency(
                    "medicines",
                    medicine.consultationId,
                    medicine.sourceName,
                    `Medicine "${medicine.sourceName}" is not mapped to a PhilHealth medicine or generic reference.`,
                );
            });
        medicalHistoryMappingResult.mappedMedicalHistory
            .filter((history) => history.mappedCode === null)
            .forEach((history) => {
                pushPatientDeficiency(
                    "medicalHistory",
                    history.patientUserId,
                    history.inputValue,
                    `Medical history entry "${history.inputValue}" is not mapped to an active PhilHealth reference.`,
                );
            });
        immunizationMappingResult.mappedImmunizations
            .filter((immunization) => immunization.mappedCode === null)
            .forEach((immunization) => {
                pushPatientDeficiency(
                    "immunizations",
                    immunization.patientUserId,
                    immunization.inputValue,
                    `Immunization "${immunization.inputValue}" is not mapped to an active PhilHealth reference.`,
                );
            });
        physicalExamMappingResult.mappedFindings
            .filter((finding) => finding.mappedCode === null)
            .forEach((finding) => {
                pushConsultationDeficiency(
                    "physicalExam",
                    finding.consultationId,
                    finding.inputValue,
                    `Physical exam finding "${finding.inputValue}" is not mapped to an active PhilHealth reference.`,
                );
            });

        const optionalDeficiencies = Array.from(
            new Set(generatedDeficiencies.map((deficiency) => deficiency.message)),
        );

        // Validate consultation records for second-tranche reports
        if (batch.reportTagging === "2" && consultationIds.length === 0) {
            throw new Error(
                "Second-tranche reports require at least one consultation SOAP entry. Please add consultations to the patient records.",
            );
        }

        const consultationRows =
            batch.reportTagging === "2" && consultationIds.length > 0
                ? await prisma.consultationTicket.findMany({
                      where: {
                          id: { in: consultationIds },
                          clinicId: batch.clinicId,
                          isActive: true,
                          isArchived: false,
                      },
                      select: {
                          id: true,
                          createdAt: true,
                          subject: true,
                          konsultaHciCaseNo: true,
                          konsultaHciTransNo: true,
                          konsultaAtc: true,
                          Appointment: {
                              select: {
                                  AppointmentAttribute: {
                                      select: { date: true, isWalkIn: true },
                                  },
                              },
                          },
                          ConsultationNotes: {
                              select: { section: true, content: true },
                          },
                          ConsultationDiagnoses: {
                              select: { icd10Code: true, type: true },
                          },
                          Interventions: {
                              where: { deletedAt: null, isActive: true },
                              select: {
                                  Action: { select: { name: true } },
                                  details: true,
                              },
                          },
                          ClinicPatient: {
                              select: { patientId: true },
                          },
                      },
                  })
                : [];

        // ── Helper: build KonsultaProfileSubData from patient history ──────────────
        const buildProfileSubData = (
            patientId: number,
            gender: string | null,
        ): KonsultaProfileSubData => {
            const hp = patientProfileMap.get(patientId);
            if (!hp) return {};

            const ph = hp.PersonalHistory;
            const ob = hp.ObGyneHistory;
            const vs = hp.VitalSigns[0];
            const pe = hp.PhysicalExaminations[0];
            const pm = hp.PediatricMeasurements[0];
            const isFemale = gender === "FEMALE";

            return {
                // SOCHIST
                isSmoker: mapSmokerStatus(ph?.smokingStatus),
                noCigpk:
                    ph?.numberOfPacksPerYear != null
                        ? String(ph.numberOfPacksPerYear)
                        : "",
                isAdrinker: mapDrinkerStatus(ph?.alcoholStatus),
                noBottles:
                    ph?.numberOfBottlesPerDay != null
                        ? String(ph.numberOfBottlesPerDay)
                        : "",
                illDrugUser: mapDrugStatus(ph?.illicitDrugUse),
                isSexuallyActive: mapSexuallyActiveStatus(ph?.sexuallyActive),

                // BLOODTYPE
                bloodType: mapBloodType(hp.bloodType),

                // PEPERT
                systolic: vs?.bpSystolic != null ? String(vs.bpSystolic) : "",
                diastolic: vs?.bpDiastolic != null ? String(vs.bpDiastolic) : "",
                hr: vs?.pulseRate != null ? String(vs.pulseRate) : "",
                rr: vs?.respRate != null ? String(vs.respRate) : "",
                temp: vs?.temp != null ? String(vs.temp) : "",
                height: vs?.height != null ? String(vs.height) : "",
                weight: vs?.weight != null ? String(vs.weight) : "",
                bmi: vs?.bmi != null ? String(vs.bmi) : "",
                leftVision: pe?.visualAcuityLeft ?? "",
                rightVision: pe?.visualAcuityRight ?? "",
                // Pediatric measurements (PEPERT)
                length: pm?.length != null ? String(pm.length) : "",
                headCirc:
                    pm?.headCircumference != null
                        ? String(pm.headCircumference)
                        : "",
                skinfoldThickness:
                    pm?.skinfoldThickness != null
                        ? String(pm.skinfoldThickness)
                        : "",
                waist:
                    pm?.waistCircumference != null
                        ? String(pm.waistCircumference)
                        : "",
                hip: pm?.hipCircumference != null ? String(pm.hipCircumference) : "",
                limbs:
                    pm?.limbCircumference != null ? String(pm.limbCircumference) : "",
                midUpperArmCirc:
                    pm?.midUpperArmCircumference != null
                        ? String(pm.midUpperArmCircumference)
                        : "",

                // MENSHIST (only applicable for female patients)
                isMenshApplicable: isFemale && ob != null ? "Y" : "N",
                menarchePeriod: ob?.menarche != null ? String(ob.menarche) : "",
                lastMensPeriod: ob?.lastMenstrualPeriod
                    ? ob.lastMenstrualPeriod.toISOString().slice(0, 10)
                    : "",
                periodDuration:
                    ob?.menstrualPeriodDuration != null
                        ? String(ob.menstrualPeriodDuration)
                        : "",
                mensInterval:
                    ob?.menstrualCycleInterval != null
                        ? String(ob.menstrualCycleInterval)
                        : "",
                padsPerDay:
                    ob?.numberOfPadsPerDay != null ? String(ob.numberOfPadsPerDay) : "",
                onsetSexIc:
                    ob?.ageAtFirstSexualIntercourse != null
                        ? String(ob.ageAtFirstSexualIntercourse)
                        : "",
                birthCtrlMethod: ob?.birthControlMethod ?? "",
                isMenopause: ob?.menopauseStatus
                    ? ob.menopauseStatus === "MENOPAUSAL"
                        ? "Y"
                        : "N"
                    : "",
                menopauseAge: ob?.menopauseAge != null ? String(ob.menopauseAge) : "",

                // PREGHIST (only applicable for female patients)
                isPreghApplicable:
                    isFemale && ob != null && (ob.gravidity != null || ob.parity != null)
                        ? "Y"
                        : "N",
                pregCnt: ob?.gravidity != null ? String(ob.gravidity) : "",
                deliveryCnt: ob?.parity != null ? String(ob.parity) : "",
                deliveryTyp: ob?.typeOfDelivery ?? "",
                fullTermCnt: ob?.fullTerm != null ? String(ob.fullTerm) : "",
                prematureCnt: ob?.premature != null ? String(ob.premature) : "",
                abortionCnt: ob?.abortion != null ? String(ob.abortion) : "",
                livChildrenCnt:
                    ob?.livingChildren != null ? String(ob.livingChildren) : "",
                wPregIndhyp:
                    ob?.hasPreEclampsia != null ? (ob.hasPreEclampsia ? "Y" : "N") : "",
                wFamPlan: "N",

                // MEDHISTS + MHSPECIFICS: use "999" (Other) with condition name as description
                medHistItems:
                    hp.MedicalHistories.length > 0
                        ? hp.MedicalHistories.map((h) => ({
                              code: "999",
                              specificDesc: [h.Condition.name, h.details]
                                  .filter(Boolean)
                                  .join(": "),
                          }))
                        : undefined,

                // SURGHISTS
                surgHistItems:
                    hp.SurgicalHistories.length > 0
                        ? hp.SurgicalHistories.map((s) => ({
                              desc: s.operationName,
                              date: s.operationDate
                                  ? s.operationDate.toISOString().slice(0, 10)
                                  : "",
                          }))
                        : undefined,

                // FAMHISTS + FHSPECIFICS: use "999" (Other) with condition name as description
                famHistItems:
                    hp.FamilyMedicalHistories.length > 0
                        ? hp.FamilyMedicalHistories.map((h) => ({
                              code: "999",
                              specificDesc: [h.Condition.name, h.details]
                                  .filter(Boolean)
                                  .join(": "),
                          }))
                        : undefined,
            };
        };

        // PROFILE elements: Type 1 (ENLISTMENT) = per-entry, Type 2 (SOAP) = per-consultation
        const profiles: KonsultaProfileData[] =
            batch.reportTagging === "1"
                ? batch.KonsultaEntries.map((entry) => {
                      const p = entry.Patient;
                      const dob = p.dob ? p.dob.toISOString().slice(0, 10) : "1990-01-01";
                      const patientType = (entry.memberType ?? "").trim() as "MM" | "DD";
                      // For MM (member): pMemPin is the patient's own PIN
                      // For DD (dependent): pMemPin is the member's PIN that they're dependent under
                      const memberPin =
                          patientType === "MM"
                              ? entry.philHealthPin
                              : entry.memberPin || entry.philHealthPin;
                      const patientAge = formatAge(dob);

                      return {
                          pHciCaseNo:
                              entry.hciCaseNo ||
                              formatKonsultaHciNumber(
                                  "T",
                                  credentials.hciAccreNo,
                                  entry.id,
                                  periodDate,
                              ),
                          pHciTransNo: formatKonsultaHciNumber(
                              "P",
                              credentials.hciAccreNo,
                              entry.id,
                              periodDate,
                          ),
                          pProfDate: periodDate.toISOString().slice(0, 10),
                          pPatientPin: entry.philHealthPin,
                          pPatientType: patientType,
                          pPatientAge: patientAge,
                          pMemPin: memberPin,
                          pEffYear: effYear,
                          pATC: "",
                          pIsWalkedIn: "N",
                          pTransDate: periodDate.toISOString().slice(0, 10),
                          pReportStatus: "U",
                          pDeficiencyRemarks: "",
                          medicalHistoryCodes:
                              mappedMedicalHistoryByPatientId.get(entry.patientUserId) ??
                              [],
                          immunizations:
                              mappedImmunizationsByPatientId.get(entry.patientUserId) ??
                              [],
                          subData: buildProfileSubData(p.id, p.gender ?? null),
                      };
                  })
                : consultationRows.map((consultation) => {
                      const entry = entryByConsultationId.get(consultation.id);
                      if (!entry)
                          throw new Error("Consultation is not attached to a batch entry.");
                      const p = entry.Patient;
                      const dob = p.dob ? p.dob.toISOString().slice(0, 10) : "1990-01-01";
                      const patientType = (entry.memberType ?? "").trim() as "MM" | "DD";
                      // For MM (member): pMemPin is the patient's own PIN
                      // For DD (dependent): pMemPin is the member's PIN that they're dependent under
                      const memberPin =
                          patientType === "MM"
                              ? entry.philHealthPin
                              : entry.memberPin || entry.philHealthPin;
                      const patientAge = formatAge(dob);
                      const profDate = (
                          consultation.Appointment?.AppointmentAttribute?.date ??
                          consultation.createdAt
                      )
                          .toISOString()
                          .slice(0, 10);
                      const isWalkIn = consultation.Appointment?.AppointmentAttribute
                          ?.isWalkIn
                          ? "Y"
                          : "N";

                      return {
                          pHciCaseNo:
                              consultation.konsultaHciCaseNo ||
                              entry.hciCaseNo ||
                              formatKonsultaHciNumber(
                                  "T",
                                  credentials.hciAccreNo,
                                  entry.id,
                                  periodDate,
                              ),
                          pHciTransNo:
                              consultation.konsultaHciTransNo ||
                              formatKonsultaHciNumber(
                                  "P",
                                  credentials.hciAccreNo,
                                  consultation.id,
                                  consultation.createdAt,
                              ),
                          pProfDate: profDate,
                          pPatientPin: entry.philHealthPin,
                          pPatientType: patientType,
                          pPatientAge: patientAge,
                          pMemPin: memberPin,
                          pEffYear: effYear,
                          pATC:
                              consultation.konsultaAtc ||
                              (isWalkIn === "Y" ? "WALKEDIN" : ""),
                          pIsWalkedIn: isWalkIn,
                          pTransDate: consultation.createdAt.toISOString().slice(0, 10),
                          pReportStatus: "U",
                          pDeficiencyRemarks: "",
                          medicalHistoryCodes:
                              mappedMedicalHistoryByPatientId.get(entry.patientUserId) ??
                              [],
                          immunizations:
                              mappedImmunizationsByPatientId.get(entry.patientUserId) ??
                              [],
                          physicalExamFindings:
                              mappedPhysicalExamFindingsByConsultationId.get(
                                  consultation.id,
                              ) ?? [],
                          subData: buildProfileSubData(p.id, p.gender ?? null),
                      };
                  });

        const soaps: KonsultaSoapData[] =
            batch.reportTagging === "2"
                ? consultationRows.map((consultation) => {
                      const entry = entryByConsultationId.get(consultation.id);
                      if (!entry)
                          throw new Error("Consultation is not attached to a batch entry.");
                      const soapDate = (
                          consultation.Appointment?.AppointmentAttribute?.date ??
                          consultation.createdAt
                      )
                          .toISOString()
                          .slice(0, 10);
                      const isWalkIn = consultation.Appointment?.AppointmentAttribute
                          ?.isWalkIn
                          ? "Y"
                          : "N";
                      const transDate = consultation.createdAt.toISOString().slice(0, 10);
                      const patientType = (
                          entry.memberType ?? ""
                      ).trim() as KonsultaPatientType;
                      // For MM (member): pMemPin is the patient's own PIN
                      // For DD (dependent): pMemPin is the member's PIN that they're dependent under
                      const memberPin =
                          patientType === "MM"
                              ? entry.philHealthPin
                              : entry.memberPin || entry.philHealthPin;

                      // Build SOAP subData from consultation clinical data
                      const subjNote = consultation.ConsultationNotes?.find(
                          (n) => n.section === "subjective",
                      );
                      const planNote = consultation.ConsultationNotes?.find(
                          (n) => n.section === "plan",
                      );
                      const assessmentNote = consultation.ConsultationNotes?.find(
                          (n) => n.section === "assessment",
                      );

                      // Vitals: find the most recent vital sign for this patient on or before consultation date
                      const consultPatientId = consultation.ClinicPatient?.patientId;
                      const patientProfileEntry = consultPatientId
                          ? patientProfileMap.get(consultPatientId)
                          : undefined;
                      const patientVitals = patientProfileEntry
                          ? patientProfileEntry.VitalSigns.find(
                                (v) => v.dateTaken <= consultation.createdAt,
                            ) ?? patientProfileEntry.VitalSigns[0]
                          : undefined;
                      // Pediatric measurements: find the closest on or before the consultation date
                      const patientPediatric = patientProfileEntry
                          ? patientProfileEntry.PediatricMeasurements.find(
                                (pm) => pm.dateTaken <= consultation.createdAt,
                            ) ?? patientProfileEntry.PediatricMeasurements[0]
                          : undefined;

                      const soapSubData: KonsultaSoapSubData = {
                          // SUBJECTIVE
                          illnessHistory: subjNote?.content ?? "",
                          otherComplaint: consultation.subject ?? "",

                          // PEPERT from vitals
                          systolic:
                              patientVitals?.bpSystolic != null
                                  ? String(patientVitals.bpSystolic)
                                  : "",
                          diastolic:
                              patientVitals?.bpDiastolic != null
                                  ? String(patientVitals.bpDiastolic)
                                  : "",
                          hr:
                              patientVitals?.pulseRate != null
                                  ? String(patientVitals.pulseRate)
                                  : "",
                          rr:
                              patientVitals?.respRate != null
                                  ? String(patientVitals.respRate)
                                  : "",
                          temp:
                              patientVitals?.temp != null
                                  ? String(patientVitals.temp)
                                  : "",
                          height:
                              patientVitals?.height != null
                                  ? String(patientVitals.height)
                                  : "",
                          weight:
                              patientVitals?.weight != null
                                  ? String(patientVitals.weight)
                                  : "",
                          bmi:
                              patientVitals?.bmi != null
                                  ? String(patientVitals.bmi)
                                  : "",
                          // Pediatric measurements
                          length:
                              patientPediatric?.length != null
                                  ? String(patientPediatric.length)
                                  : "",
                          headCirc:
                              patientPediatric?.headCircumference != null
                                  ? String(patientPediatric.headCircumference)
                                  : "",
                          skinfoldThickness:
                              patientPediatric?.skinfoldThickness != null
                                  ? String(patientPediatric.skinfoldThickness)
                                  : "",
                          waist:
                              patientPediatric?.waistCircumference != null
                                  ? String(patientPediatric.waistCircumference)
                                  : "",
                          hip:
                              patientPediatric?.hipCircumference != null
                                  ? String(patientPediatric.hipCircumference)
                                  : "",
                          limbs:
                              patientPediatric?.limbCircumference != null
                                  ? String(patientPediatric.limbCircumference)
                                  : "",
                          midUpperArmCirc:
                              patientPediatric?.midUpperArmCircumference != null
                                  ? String(patientPediatric.midUpperArmCircumference)
                                  : "",

                          // ICDS from ConsultationDiagnoses
                          icdCodes:
                              consultation.ConsultationDiagnoses?.map(
                                  (d) => d.icd10Code,
                              ) ?? [],

                          // MANAGEMENTS from Interventions (mapped to code "X" = Other)
                          managements:
                              consultation.Interventions &&
                              consultation.Interventions.length > 0
                                  ? consultation.Interventions.map((i) => ({
                                        id: "X",
                                        othRemarks:
                                            `${i.Action.name}${i.details ? `: ${i.details}` : ""}`.slice(
                                                0,
                                                200,
                                            ),
                                    }))
                                  : undefined,

                          // ADVICE from plan or assessment note
                          advice: (
                              planNote?.content ??
                              assessmentNote?.content ??
                              ""
                          ).slice(0, 500),
                      };

                      return {
                          pHciCaseNo:
                              consultation.konsultaHciCaseNo ||
                              entry.hciCaseNo ||
                              formatKonsultaHciNumber(
                                  "T",
                                  credentials.hciAccreNo,
                                  entry.id,
                                  periodDate,
                              ),
                          pHciTransNo:
                              consultation.konsultaHciTransNo ||
                              formatKonsultaHciNumber(
                                  "S",
                                  credentials.hciAccreNo,
                                  consultation.id,
                                  consultation.createdAt,
                              ),
                          pSoapDate: soapDate,
                          pPatientPin: entry.philHealthPin,
                          pPatientType: patientType,
                          pMemPin: memberPin,
                          pEffYear: effYear,
                          pATC:
                              consultation.konsultaAtc ||
                              (isWalkIn === "Y" ? "WALKEDIN" : ""),
                          pIsWalkedIn: isWalkIn,
                          pCoPay: "0",
                          pTransDate: transDate,
                          pReportStatus: "U",
                          pDeficiencyRemarks: "",
                          icdCodes:
                              mappedIcdCodesByConsultationId.get(consultation.id) ??
                              [],
                          diagnosticCodes:
                              mappedDiagnosticsByConsultationId.get(consultation.id) ??
                              [],
                          managementCodes:
                              mappedManagementByConsultationId.get(consultation.id) ??
                              [],
                          physicalExamFindings:
                              mappedPhysicalExamFindingsByConsultationId.get(
                                  consultation.id,
                              ) ?? [],
                          subData: soapSubData,
                      };
                  })
                : [];

        const medicines = medicineMappingResult.mappedMedicines
            .map((medicine) => {
                const entry = entryByConsultationId.get(medicine.consultationId);
                if (!entry) {
                    return null;
                }

                return {
                    pHciCaseNo:
                        entry.hciCaseNo ||
                        formatKonsultaHciNumber(
                            "T",
                            credentials.hciAccreNo,
                            entry.id,
                            periodDate,
                        ),
                    pHciTransNo:
                        entry.hciTransNo ||
                        formatKonsultaHciNumber(
                            "S",
                            credentials.hciAccreNo,
                            medicine.consultationId,
                            periodDate,
                        ),
                    pCategory: "",
                    pDrugCode: medicine.mappedDrugCode ?? "",
                    pGenericCode: medicine.mappedGenericCode ?? "",
                    pSaltCode: "",
                    pStrengthCode: "",
                    pFormCode: "",
                    pUnitCode: "",
                    pPackageCode: "",
                    pOtherMedicine: "",
                    pRoute: "",
                    pQuantity: medicine.quantity ? String(medicine.quantity) : "",
                    pActualUnitPrice: "",
                    pTotalAmtPrice: "",
                    pInstructionQuantity: medicine.quantity ? String(medicine.quantity) : "",
                    pInstructionStrength: medicine.dosage ?? "",
                    pInstructionFrequency: medicine.frequency ?? "",
                    pPrescribingPhysician: "",
                    pIsDispensed: "N",
                    pDateDispensed: "",
                    pDispensingPersonnel: "",
                    pIsApplicable: "Y" as const,
                    pDateAdded: periodDate.toISOString().slice(0, 10),
                    pReportStatus: "U" as const,
                    pDeficiencyRemarks: "",
                };
            })
            .filter(
                (medicine): medicine is NonNullable<typeof medicine> =>
                    medicine !== null,
            );

        const xml = buildPcbXml({
            credentials,
            transmittalNumber: transmittalNo,
            enlistments: batch.reportTagging === "1" ? enlistments : [],
            profiles,
            soaps,
            medicines,
        });

        // Update batch with new XML and clear old validation/submission results
        await prisma.konsultaBatch.update({
            where: { batchUid },
            data: {
                xmlPayload: xml,
                transmittalNo,
                status: "GENERATED",
                errorMessage: summarizeGeneratedKonsultaBatchDeficiencies(
                    generatedDeficiencies,
                ),
            },
        });

        // Clear validation and submission results using raw query to handle JSON null properly
        await prisma.$executeRaw`
            UPDATE "KonsultaBatch" 
            SET "validateResult" = NULL, "submitResult" = NULL 
            WHERE "batchUid" = ${batchUid}
        `;

        if (generatedDeficiencies.length > 0) {
            await prisma.konsultaBatch.update({
                where: { batchUid },
                data: {
                    validateResult: toInputJsonObject({
                        generatedDeficiencies,
                    }),
                },
            });
        }

        // Reset all included entries back to PENDING status so they can be re-validated
        await prisma.konsultaEntry.updateMany({
            where: { batchId: batch.id, included: true },
            data: { status: "PENDING" },
        });

        return {
            message: "XML generated successfully",
            data: { transmittalNo, xmlLength: xml.length, xmlPayload: xml },
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to generate XML.";
        await prisma.konsultaBatch.update({
            where: { batchUid },
            data: {
                status: "FAILED",
                errorMessage: message,
            },
        });
        await prisma.konsultaEntry.updateMany({
            where: { batchId: batch.id, included: true },
            data: { status: "FAILED" },
        });
        throw error;
    }
});

// ─── Validate + Submit ────────────────────────────────────────────────────────

export const validateKonsultaBatchAction = withErrorHandling(
    async (batchUid: string) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const batch = await prisma.konsultaBatch.findUnique({
            where: { batchUid },
            select: {
                id: true,
                clinicId: true,
                xmlPayload: true,
                transmittalNo: true,
                reportTagging: true,
                status: true,
                validateResult: true,
            },
        });
        if (!batch) throw new Error("Batch not found");
        if (!batch.xmlPayload || !batch.transmittalNo) {
            throw new Error("Generate the XML first before validating.");
        }
        if (batch.status === "SUBMITTED")
            throw new Error("Batch already submitted.");
        const generatedDeficiencies = extractGeneratedKonsultaBatchDeficiencies(
            batch.validateResult,
        );

        const credentials = await getClinicKonsultaCredentials(batch.clinicId);
        const encryptedPayload = encryptXmlPayload(
            batch.xmlPayload,
            credentials.cipherKey,
        );

        const {
            getToken: konsultaGetToken,
            validateReport: konsultaValidateReport,
        } = await import("@/services/konsulta/konsulta-soap.service");

        const tokenRaw = await konsultaGetToken({
            pUsername: credentials.username,
            pUserPassword: credentials.password,
            pSoftwareCertificationId: credentials.certificationId,
            pHospitalCode: credentials.hciAccreNo,
        });
        let token = tokenRaw.return;
        try {
            token = (JSON.parse(token) as { result?: string }).result ?? token;
        } catch {
            /* plain string */
        }

        const validateRaw = await konsultaValidateReport(
            {
                pReport: encryptedPayload,
                pReportTagging: batch.reportTagging as "1" | "2",
            },
            token,
        );

        interface ValidateResponse {
            success?: boolean;
            message?: string;
            encryptedxml?: unknown;
            encryptedxmlerrors?: unknown;
            [key: string]: unknown;
        }

        let validateResult: Prisma.InputJsonObject;
        let decryptedErrors: string | null = null;
        let validationPassed = false;

        try {
            let parsed = JSON.parse(validateRaw.return) as ValidateResponse;
            if (typeof parsed === "string")
                parsed = JSON.parse(parsed) as ValidateResponse;

            validationPassed = parsed.success === true;

            // Decrypt encryptedxmlerrors if present
            if (!validationPassed && parsed.encryptedxmlerrors) {
                try {
                    if (!credentials.cipherKey) {
                        throw new Error("Cipher key not available for decryption");
                    }
                    decryptedErrors = decryptXmlPayload(
                        JSON.stringify(parsed.encryptedxmlerrors),
                        credentials.cipherKey,
                    );
                } catch (decryptErr) {
                    const errMsg =
                        decryptErr instanceof Error
                            ? decryptErr.message
                            : String(decryptErr);
                    decryptedErrors = `ERROR: ${errMsg}\n\nRaw encrypted payload available in raw JSON.`;
                }
            }

            // Strip large encrypted blobs before storing
            if (parsed.encryptedxml) delete parsed.encryptedxml;
            if (parsed.encryptedxmlerrors) delete parsed.encryptedxmlerrors;

            validateResult = toInputJsonObject({
                ...parsed,
                ...(decryptedErrors ? { decryptedErrors } : {}),
                ...(generatedDeficiencies.length > 0
                    ? { generatedDeficiencies }
                    : {}),
            });
        } catch (parseErr) {
            const errMsg =
                parseErr instanceof Error ? parseErr.message : String(parseErr);
            validateResult = toInputJsonObject({
                raw: validateRaw.return,
                parseError: errMsg,
                ...(generatedDeficiencies.length > 0
                    ? { generatedDeficiencies }
                    : {}),
            });
        }

        if (!validationPassed) {
            // Format decrypted errors for display
            let formattedErrorMessage =
                "Validation failed. Review the batch response for details.";
            let errorMessageForToast = formattedErrorMessage;

            if (decryptedErrors) {
                try {
                    // Try to parse and format the JSON errors
                    const parsedErrors = JSON.parse(decryptedErrors) as {
                        errors?: unknown[];
                    };
                    if (parsedErrors.errors && Array.isArray(parsedErrors.errors)) {
                        // Create a formatted error message for the database
                        formattedErrorMessage = `Validation failed: ${parsedErrors.errors
                            .slice(0, 3) // First 3 errors
                            .join("; ")}`;
                        // Create a JSON structure for the client to parse
                        errorMessageForToast = JSON.stringify({
                            errors: parsedErrors.errors,
                        });
                    } else {
                        formattedErrorMessage = `Validation failed: ${decryptedErrors.slice(0, 300)}`;
                        errorMessageForToast = decryptedErrors;
                    }
                } catch {
                    // If parsing fails, use the raw string
                    formattedErrorMessage = `Validation failed: ${decryptedErrors.slice(0, 300)}`;
                    errorMessageForToast = decryptedErrors;
                }
            }

            await prisma.konsultaBatch.update({
                where: { batchUid },
                data: {
                    status: "FAILED",
                    validateResult,
                    errorMessage: formattedErrorMessage,
                },
            });

            // Mark entries as FAILED since batch validation failed
            await prisma.konsultaEntry.updateMany({
                where: { batchId: batch.id, included: true },
                data: { status: "FAILED" },
            });

            throw new Error(errorMessageForToast);
        }

        // Update batch status
        await prisma.konsultaBatch.update({
            where: { batchUid },
            data: { status: "VALIDATED", validateResult, errorMessage: null },
        });

        // Update all included entries to INCLUDED status
        await prisma.konsultaEntry.updateMany({
            where: { batchId: batch.id, included: true },
            data: { status: "INCLUDED" },
        });

        return {
            message: "Batch validated successfully. Ready to submit.",
            data: { validateResult },
        };
    },
);

export const decryptStoredValidationErrorsAction = withErrorHandling(
    async (batchUid: string, resultType: "validate" | "submit" = "validate") => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const batch = await prisma.konsultaBatch.findUnique({
            where: { batchUid },
            select: {
                id: true,
                clinicId: true,
                validateResult: true,
                submitResult: true,
            },
        });
        if (!batch) throw new Error("Batch not found");

        const result =
            resultType === "validate" ? batch.validateResult : batch.submitResult;
        if (!result)
            throw new Error(`No ${resultType} result found for this batch`);

        const resultObj = result as Record<string, unknown>;

        // Check if encryptedxmlerrors is still present (raw encrypted form)
        if (!resultObj.encryptedxmlerrors) {
            // Already decrypted or no errors
            if (resultObj.decryptedErrors) {
                return {
                    message: `${resultType === "validate" ? "Validation" : "Submission"} errors already decrypted`,
                    data: { decryptedErrors: resultObj.decryptedErrors },
                };
            }
            throw new Error("No encrypted errors found in this result");
        }

        const credentials = await getClinicKonsultaCredentials(batch.clinicId);
        let decryptedErrors: string | null = null;

        try {
            if (!credentials.cipherKey) {
                throw new Error("Cipher key not available for decryption");
            }
            decryptedErrors = decryptXmlPayload(
                JSON.stringify(resultObj.encryptedxmlerrors),
                credentials.cipherKey,
            );
        } catch (decryptErr) {
            const errMsg =
                decryptErr instanceof Error ? decryptErr.message : String(decryptErr);
            decryptedErrors = `ERROR: ${errMsg}`;
        }

        // Update the batch with decrypted errors and remove encrypted blob
        const updated = { ...resultObj };
        delete updated.encryptedxmlerrors;
        updated.decryptedErrors = decryptedErrors;

        const updateData =
            resultType === "validate"
                ? { validateResult: toInputJsonObject(updated) }
                : { submitResult: toInputJsonObject(updated) };

        await prisma.konsultaBatch.update({
            where: { batchUid },
            data: updateData,
        });

        return {
            message: `${resultType === "validate" ? "Validation" : "Submission"} errors decrypted successfully`,
            data: { decryptedErrors },
        };
    },
);

export const submitKonsultaBatchAction = withErrorHandling(
    async (batchUid: string) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const batch = await prisma.konsultaBatch.findUnique({
            where: { batchUid },
            select: {
                id: true,
                clinicId: true,
                xmlPayload: true,
                transmittalNo: true,
                reportTagging: true,
                status: true,
            },
        });
        if (!batch) throw new Error("Batch not found");
        if (!batch.xmlPayload || !batch.transmittalNo) {
            throw new Error("Generate the XML first before submitting.");
        }
        if (batch.status !== "VALIDATED") {
            throw new Error(
                "Batch must be validated before submitting. Run validation first.",
            );
        }

        const credentials = await getClinicKonsultaCredentials(batch.clinicId);
        const encryptedPayload = encryptXmlPayload(
            batch.xmlPayload,
            credentials.cipherKey,
        );

        const { getToken: konsultaGetToken, submitReport: konsultaSubmitReport } =
            await import("@/services/konsulta/konsulta-soap.service");

        const tokenRaw = await konsultaGetToken({
            pUsername: credentials.username,
            pUserPassword: credentials.password,
            pSoftwareCertificationId: credentials.certificationId,
            pHospitalCode: credentials.hciAccreNo,
        });
        let token = tokenRaw.return;
        try {
            token = (JSON.parse(token) as { result?: string }).result ?? token;
        } catch {
            /* plain string */
        }

        const submitRaw = await konsultaSubmitReport(
            {
                pTransmittalID: batch.transmittalNo,
                pReport: encryptedPayload,
                pReportTagging: batch.reportTagging as "1" | "2",
            },
            token,
        );

        let submitResult: Prisma.InputJsonObject;
        try {
            let parsed = JSON.parse(submitRaw.return) as Record<string, unknown>;
            if (typeof parsed === "string")
                parsed = JSON.parse(parsed) as Record<string, unknown>;
            if (parsed.encryptedxml) delete parsed.encryptedxml;
            if (
                parsed.uploadxmlresult &&
                typeof (parsed.uploadxmlresult as Record<string, unknown>).errors ===
                "string"
            ) {
                try {
                    (parsed.uploadxmlresult as Record<string, unknown>).errors =
                        JSON.parse(
                            (parsed.uploadxmlresult as Record<string, unknown>)
                                .errors as string,
                        ) as unknown;
                } catch {
                    /* leave as string */
                }
            }
            submitResult = toInputJsonObject(parsed);
        } catch {
            submitResult = { raw: submitRaw.return };
        }

        await prisma.konsultaBatch.update({
            where: { batchUid },
            data: {
                status: "SUBMITTED",
                submitResult,
                submittedAt: new Date(),
                errorMessage: null,
            },
        });

        return {
            message: "Batch submitted to PhilHealth successfully.",
            data: { submitResult },
        };
    },
);

// ─── Generate Consultation Case/Trans Numbers ─────────────────────────────────

export const generateConsultationCaseTransNumbersAction = withErrorHandling(
    async ({ consultationTicketId }: { consultationTicketId: number }) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        // Get consultation with clinic info
        const consultation = await prisma.consultationTicket.findUnique({
            where: { id: consultationTicketId },
            include: {
                ClinicPatient: true,
                Appointment: {
                    include: {
                        Requesters: {
                            include: {
                                User: true,
                            },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!consultation) {
            throw new Error("Consultation not found");
        }

        // Check if already has both numbers
        if (consultation.konsultaHciCaseNo && consultation.konsultaHciTransNo) {
            return {
                message: "Consultation already has case and transaction numbers",
                data: {
                    konsultaHciCaseNo: consultation.konsultaHciCaseNo,
                    konsultaHciTransNo: consultation.konsultaHciTransNo,
                },
            };
        }

        // Verify consultation is for a registered patient (support both direct and old paths)
        let clinicPatientRegistrationStatus: string | null = null;

        // Path 1: Direct clinic patient link
        if (consultation.ClinicPatient) {
            clinicPatientRegistrationStatus =
                consultation.ClinicPatient.konsultaRegistrationStatus;
        }
        // Path 2: Old path through appointment requester - look up clinic patient for this patient
        else if (consultation.Appointment?.Requesters[0]?.User?.id) {
            const requesterUserId = consultation.Appointment.Requesters[0].User.id;
            const clinicPatient = await prisma.clinicPatient.findFirst({
                where: {
                    clinicId: consultation.clinicId,
                    patientId: requesterUserId,
                },
                select: { konsultaRegistrationStatus: true },
            });
            if (clinicPatient) {
                clinicPatientRegistrationStatus =
                    clinicPatient.konsultaRegistrationStatus;
            }
        }

        if (clinicPatientRegistrationStatus !== "REGISTERED") {
            throw new Error(
                "Consultation is not linked to a registered PhilHealth patient",
            );
        }

        // Get clinic credentials for HCI accreditation number
        const credentials = await getClinicKonsultaCredentials(
            consultation.clinicId,
        );

        // Get next sequence numbers for this clinic on this date
        const caseSequence = await getNextSequenceNumber(
            "KONSULTA_HCI_CASE",
            consultation.clinicId,
            consultation.createdAt,
        );
        const transSequence = await getNextSequenceNumber(
            "KONSULTA_HCI_TRANS",
            consultation.clinicId,
            consultation.createdAt,
        );

        // Format the HCI numbers
        const konsultaHciCaseNo = formatKonsultaHciNumber(
            "T",
            credentials.hciAccreNo,
            caseSequence,
            consultation.createdAt,
        );
        const konsultaHciTransNo = formatKonsultaHciNumber(
            "E",
            credentials.hciAccreNo,
            transSequence,
            consultation.createdAt,
        );

        // Update consultation with generated numbers
        const updated = await prisma.consultationTicket.update({
            where: { id: consultationTicketId },
            data: {
                konsultaHciCaseNo,
                konsultaHciTransNo,
            },
            select: {
                konsultaHciCaseNo: true,
                konsultaHciTransNo: true,
                caseNumber: true,
            },
        });

        return {
            message: "Case and transaction numbers generated successfully",
            data: {
                konsultaHciCaseNo: updated.konsultaHciCaseNo,
                konsultaHciTransNo: updated.konsultaHciTransNo,
            },
        };
    },
);
