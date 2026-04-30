"use server";

import prisma from "@lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";
import { Prisma, type KonsultaBatchStatus } from "@prisma/client";
import { buildPcbXml } from "@/services/konsulta/pcb-xml-builder";
import { encryptXmlPayload } from "@/services/konsulta/xml-encryption.service";
import { generateTransmittalNumber } from "@/services/konsulta/pcb-xml-builder";
import type { KonsultaEnlistmentData, KonsultaPatientType, KonsultaSoapData } from "@/services/konsulta/types";
import { formatKonsultaHciNumber } from "@/lib/format-sequence";
import { getNextSequenceNumber } from "@/lib/sequence-generator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GetPhilHealthPatients = Awaited<ReturnType<typeof getPhilHealthPatientsAction>>;
export type GetAllClinicPatientsWithPhilHealthStatus = Awaited<ReturnType<typeof getAllClinicPatientsWithPhilHealthStatusAction>>;
export type GetPhilHealthConsultations = Awaited<ReturnType<typeof getPhilHealthConsultationsAction>>;
export type GetKonsultaBatches = Awaited<ReturnType<typeof getKonsultaBatchesAction>>;
export type GetKonsultaBatch = Awaited<ReturnType<typeof getKonsultaBatchAction>>;

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
            konsultaCipherKey: true,
        },
    });
    if (
        !setting?.konsultaUsername ||
        !setting.konsultaPassword ||
        !setting.philhealthAccreditationNumber ||
        !setting.pmccNumber ||
        !setting.konsultaCipherKey
    ) {
        throw new Error("PhilHealth Konsulta credentials are not fully configured in Clinic Settings.");
    }
    return {
        username: setting.konsultaUsername,
        password: setting.konsultaPassword,
        hciAccreNo: setting.philhealthAccreditationNumber,
        pmccNumber: setting.pmccNumber,
        certificationId: setting.pmccNumber,
        cipherKey: setting.konsultaCipherKey,
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

type MutableInputJsonObject = { [key: string]: Prisma.InputJsonValue | null };

function toInputJsonValue(value: unknown): Prisma.InputJsonValue | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
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

function isMutableInputJsonObject(value: Prisma.InputJsonValue | null): value is MutableInputJsonObject {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function toInputJsonObject(value: unknown): Prisma.InputJsonObject {
    const jsonValue = toInputJsonValue(value);
    if (isMutableInputJsonObject(jsonValue)) return jsonValue;
    return { raw: jsonValue };
}

function parseSoapReturn(raw: string): Prisma.InputJsonObject {
    let value: unknown = raw;
    try { value = JSON.parse(raw) as unknown; } catch { return { raw }; }
    if (typeof value === "string") {
        try { value = JSON.parse(value) as unknown; } catch { return toInputJsonObject({ raw: value }); }
    }
    return toInputJsonObject(value);
}

function extractSoapResultText(result: Prisma.InputJsonObject): string {
    const candidates = [result.result, result.return, result.message, result.raw];
    const found = candidates.find((v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean");
    return found === undefined ? JSON.stringify(result) : String(found);
}

function isAffirmativeSoapResult(result: Prisma.InputJsonObject): boolean {
    const text = extractSoapResultText(result).trim().toLowerCase();
    return ["yes", "y", "true", "1", "valid", "registered"].includes(text) ||
        (text.includes("yes") && !text.includes("not")) ||
        (text.includes("valid") && !text.includes("invalid"));
}

async function getKonsultaTokenForClinic(clinicId: number): Promise<string> {
    const credentials = await getClinicKonsultaCredentials(clinicId);
    const { getToken: konsultaGetToken } = await import("@/services/konsulta/konsulta-soap.service");
    const tokenRaw = await konsultaGetToken({
        pUsername: credentials.username,
        pUserPassword: credentials.password,
        pSoftwareCertificationId: credentials.certificationId,
        pHospitalCode: credentials.hciAccreNo,
    });
    let token = tokenRaw.return;
    try { token = (JSON.parse(token) as { result?: string }).result ?? token; } catch { /* plain string */ }
    return token;
}

async function resolveDefaultMemberTypeId(tx: Prisma.TransactionClient): Promise<number> {
    const memberType = await tx.philHealthMemberType.findFirst({
        where: { isActive: true },
        orderBy: { id: "asc" },
        select: { id: true },
    });
    if (!memberType) throw new Error("PhilHealth member type reference data is not configured.");
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
            { PhilHealthRecords: { some: { deletedAt: null, pin: { contains: q, mode: "insensitive" } } } },
        ],
    };
}

/** Returns clinic patients currently registered to this HCI for the effective year. */
export const getPhilHealthPatientsAction = withErrorHandling(async (clinicUid: string) => {
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
});

/** Returns one independently paginated Konsulta patient feed. */
export const getAllClinicPatientsWithPhilHealthStatusAction = withErrorHandling(
    async ({ clinicUid, kind, skip = 0, take = 30, search = "" }: GetKonsultaPatientListParams) => {
        const session = await getCachedSession();
        if (!session) throw new Error("Unauthorized");

        const clinicId = await resolveClinicId(clinicUid);
        const effYear = currentEffYear();
        const page = normalizePage(skip, take);
        const patientSearch = buildPatientSearch(search);
        const registrationFilter: Prisma.ClinicPatientWhereInput = kind === "ENROLLED"
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
    }
);

export const enrollPatientPhilHealthAction = withErrorHandling(async ({
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
    if (patientType !== "MM" && patientType !== "DD") throw new Error("Patient type must be Member or Dependent.");

    const clinicId = await resolveClinicId(clinicUid);
    const effYear = currentEffYear();
    const normalizedPin = pin.trim();
    if (!normalizedPin) throw new Error("PhilHealth PIN is required.");

    const identity = await prisma.$transaction(async (tx): Promise<ClinicPatientIdentity> => {
        const clinicPatient = await tx.clinicPatient.findFirst({
            where: { id: clinicPatientId, clinicId, isActive: true, deletedAt: null },
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
            throw new Error(`Patient is already registered to ${otherRegisteredClinic.Clinic.name} for ${effYear}.`);
        }

        const existingRecord = clinicPatient.Patient.PhilHealthRecords[0];
        if (existingRecord) {
            await tx.philHealthRecord.update({
                where: { id: existingRecord.id },
                data: {
                    pin: normalizedPin,
                    philSysId: philSysId?.trim() || null,
                    tin: tin?.trim() || null,
                },
            });
        } else {
            await tx.philHealthRecord.create({
                data: {
                    userId: clinicPatient.Patient.id,
                    pin: normalizedPin,
                    memberTypeId: await resolveDefaultMemberTypeId(tx),
                    philSysId: philSysId?.trim() || null,
                    tin: tin?.trim() || null,
                },
            });
        }

        await tx.clinicPatient.update({
            where: { id: clinicPatient.id },
            data: {
                konsultaPatientType: patientType,
                konsultaMemberPin: patientType === "MM" ? normalizedPin : memberPin?.trim() || null,
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
            patientName: `${clinicPatient.Patient.firstName ?? ""} ${clinicPatient.Patient.lastName ?? ""}`.trim(),
            pin: normalizedPin,
            patientType,
        };
    });

    let registrationStatus = "FAILED";
    let registrationResult: Prisma.InputJsonObject;
    try {
        const token = await getKonsultaTokenForClinic(clinicId);
        const { isMemberDependentRegistered } = await import("@/services/konsulta/konsulta-soap.service");
        const raw = await isMemberDependentRegistered({ pPIN: identity.pin, pType: identity.patientType }, token);
        registrationResult = parseSoapReturn(raw.return);
        registrationStatus = isAffirmativeSoapResult(registrationResult) ? "REGISTERED" : "NOT_REGISTERED";
    } catch (error) {
        registrationResult = { error: error instanceof Error ? error.message : String(error) };
    }

    await prisma.clinicPatient.update({
        where: { id: identity.clinicPatientId },
        data: {
            konsultaRegistrationStatus: registrationStatus,
            konsultaRegisteredAt: registrationStatus === "REGISTERED" ? new Date() : null,
            konsultaRegistrationCheckedAt: new Date(),
            konsultaRegistrationResult: registrationResult,
        },
    });

    return {
        message: registrationStatus === "REGISTERED"
            ? "Patient is registered to this Konsulta provider."
            : "Patient details saved, but PhilHealth did not confirm registration to this provider.",
        data: { ...identity, registrationStatus, registrationResult },
    };
});

export const unenrollKonsultaPatientAction = withErrorHandling(async ({
    clinicUid,
    clinicPatientId,
}: { clinicUid: string; clinicPatientId: number }) => {
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

    return { message: "Patient removed from this clinic's Konsulta enrolled list", data: null };
});

export const checkKonsultaPatientRegistrationAction = withErrorHandling(async ({
    clinicUid,
    clinicPatientId,
}: { clinicUid: string; clinicPatientId: number }) => {
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
                    PhilHealthRecords: { where: { deletedAt: null }, select: { pin: true }, take: 1 },
                },
            },
        },
    });
    if (!patient) throw new Error("Patient not found in this clinic");
    const pin = patient.Patient.PhilHealthRecords[0]?.pin;
    const patientType = patient.konsultaPatientType as KonsultaPatientType | null;
    if (!pin || !patientType) throw new Error("PhilHealth PIN and patient type are required before checking registration.");

    const token = await getKonsultaTokenForClinic(clinicId);
    const { isMemberDependentRegistered } = await import("@/services/konsulta/konsulta-soap.service");
    const raw = await isMemberDependentRegistered({ pPIN: pin, pType: patientType }, token);
    const registrationResult = parseSoapReturn(raw.return);
    const registrationStatus = isAffirmativeSoapResult(registrationResult) ? "REGISTERED" : "NOT_REGISTERED";

    await prisma.clinicPatient.update({
        where: { id: patient.id },
        data: {
            konsultaEffYear: currentEffYear(),
            konsultaRegistrationStatus: registrationStatus,
            konsultaRegisteredAt: registrationStatus === "REGISTERED" ? new Date() : null,
            konsultaRegistrationCheckedAt: new Date(),
            konsultaRegistrationResult: registrationResult,
        },
    });

    return { message: "Konsulta registration checked", data: { registrationStatus, registrationResult } };
});

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
            select: { id: true },
        });

        if (enrolledClinicPatients.length === 0) {
            return { message: "No enrolled PhilHealth patients", data: [] };
        }

        const enrolledIds = enrolledClinicPatients.map((cp) => cp.id);

        const dateFilter =
            from && to ? { gte: from, lte: to } : undefined;

        const consultations = await prisma.consultationTicket.findMany({
            where: {
                clinicId,
                isActive: true,
                isArchived: false,
                clinicPatientId: { in: enrolledIds },
                createdAt: dateFilter,
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
                Appointment: {
                    select: {
                        AppointmentAttribute: { select: { date: true, isWalkIn: true } },
                    },
                },
                ClinicPatient: {
                    select: {
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

        return {
            message: "PhilHealth consultations retrieved",
            data: consultations,
        };
    }
);

export const validateKonsultaAtcAction = withErrorHandling(async ({
    clinicUid,
    consultationTicketId,
    atc,
}: { clinicUid: string; consultationTicketId: number; atc: string }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const clinicId = await resolveClinicId(clinicUid);
    const consultation = await prisma.consultationTicket.findFirst({
        where: { id: consultationTicketId, clinicId, isActive: true, isArchived: false },
        select: {
            id: true,
            createdAt: true,
            Appointment: { select: { AppointmentAttribute: { select: { date: true } } } },
            ClinicPatient: {
                select: {
                    Patient: {
                        select: {
                            PhilHealthRecords: { where: { deletedAt: null }, select: { pin: true }, take: 1 },
                        },
                    },
                },
            },
        },
    });
    if (!consultation) throw new Error("Consultation not found");
    const pin = consultation.ClinicPatient?.Patient.PhilHealthRecords[0]?.pin;
    if (!pin) throw new Error("Patient has no PhilHealth PIN.");
    const normalizedAtc = atc.trim().toUpperCase();
    if (!normalizedAtc) throw new Error("ATC is required.");

    const effectivityDate = (consultation.Appointment?.AppointmentAttribute?.date ?? consultation.createdAt)
        .toISOString()
        .slice(0, 10);
    const token = await getKonsultaTokenForClinic(clinicId);
    const { isATCValid } = await import("@/services/konsulta/konsulta-soap.service");
    const raw = await isATCValid({ pPIN: pin, pATC: normalizedAtc, pEffectivityDate: effectivityDate }, token);
    const validationResult = parseSoapReturn(raw.return);
    const validationStatus = isAffirmativeSoapResult(validationResult) ? "VALID" : "INVALID";

    await prisma.consultationTicket.update({
        where: { id: consultation.id },
        data: {
            konsultaAtc: normalizedAtc,
            konsultaAtcValidationStatus: validationStatus,
            konsultaAtcValidatedAt: new Date(),
            konsultaAtcValidationResult: validationResult,
        },
    });

    return { message: "ATC validation completed", data: { validationStatus, validationResult } };
});

// ─── Batches ──────────────────────────────────────────────────────────────────

/** Returns all Konsulta batches for a clinic, newest first. */
export const getKonsultaBatchesAction = withErrorHandling(async (clinicUid: string) => {
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
                select: { id: true, philHealthPin: true, memberPin: true, memberType: true, hciCaseNo: true, hciTransNo: true, status: true, included: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return { message: "Batches retrieved", data: batches };
});

/** Returns a single batch with full detail. */
export const getKonsultaBatchAction = withErrorHandling(async (batchUid: string) => {
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
                        select: { firstName: true, lastName: true, dob: true, gender: true },
                    },
                },
            },
        },
    });
    if (!batch) throw new Error("Batch not found");

    return { message: "Batch retrieved", data: batch };
});

// ─── Create Batch ─────────────────────────────────────────────────────────────

export type CreateKonsultaBatchPayload = {
    clinicUid: string;
    period: string;             // "YYYYMM"
    reportTagging: "1" | "2";
    notes?: string;
    patientUserIds: number[];   // patients to include
};

export const createKonsultaBatchAction = withErrorHandling(
    async ({ clinicUid, period, reportTagging, notes, patientUserIds }: CreateKonsultaBatchPayload) => {
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
                        PhilHealthRecords: { where: { deletedAt: null }, select: { pin: true }, take: 1 },
                    },
                },
            },
        });

        if (eligiblePatients.length === 0) {
            throw new Error("Selected patients are not registered to this Konsulta provider for the reporting year.");
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

        const entrySequences = new Map<number, { caseSequence: number; transSequence: number }>();
        for (const patient of eligiblePatients) {
            const transEntityType = reportTagging === "1"
                ? "KONSULTA_ENLISTMENT_TRANSACTION"
                : "KONSULTA_SOAP_TRANSACTION";
            entrySequences.set(patient.id, {
                caseSequence: await getNextSequenceNumber("KONSULTA_HCI_CASE", clinicId, periodStart),
                transSequence: await getNextSequenceNumber(transEntityType, clinicId, periodStart),
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
                    createdBy: (await tx.user.findFirst({ where: { userId: session.user.sub }, select: { id: true } }))?.id,
                },
            });

            // Build entries
            const entries = eligiblePatients.map((patient) => {
                const pin = patient.Patient.PhilHealthRecords[0]?.pin ?? "";
                const memberType = (patient.konsultaPatientType === "DD" ? "DD" : "MM") as KonsultaPatientType;
                const sequence = entrySequences.get(patient.id);
                return {
                    batchId: created.id,
                    patientUserId: patient.patientId,
                    philHealthPin: pin,
                    memberPin: memberType === "MM" ? pin : patient.konsultaMemberPin,
                    memberType,
                    hciCaseNo: formatKonsultaHciNumber("T", credentials.hciAccreNo, sequence?.caseSequence ?? patient.id, periodStart),
                    hciTransNo: formatKonsultaHciNumber(reportTagging === "1" ? "E" : "S", credentials.hciAccreNo, sequence?.transSequence ?? patient.id, periodStart),
                    consultationIds: consultationsByPatient.get(patient.patientId) ?? [],
                    included: true,
                    status: pin ? "PENDING" : "FAILED",
                    errorMessage: pin ? null : "No PhilHealth PIN found",
                };
            });

            await tx.konsultaEntry.createMany({ data: entries });

            return created;
        });

        return { message: "Batch created successfully", data: { batchUid: batch.batchUid } };
    }
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
    }
);

// ─── Delete Batch ─────────────────────────────────────────────────────────────

export const deleteKonsultaBatchAction = withErrorHandling(async (batchUid: string) => {
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
});

// ─── Generate XML ─────────────────────────────────────────────────────────────

export const generateBatchXmlAction = withErrorHandling(async (batchUid: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const batch = await prisma.konsultaBatch.findUnique({
        where: { batchUid },
        include: {
            KonsultaEntries: {
                where: { included: true, status: { not: "FAILED" } },
                include: {
                    Patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            middleName: true,
                            suffix: true,
                            dob: true,
                            gender: true,
                            mobile: true,
                        },
                    },
                },
            },
        },
    });
    if (!batch) throw new Error("Batch not found");
    if (batch.status === "SUBMITTED") throw new Error("Batch already submitted.");

    const credentials = await getClinicKonsultaCredentials(batch.clinicId);
    const seq = Math.floor(Date.now() / 1000) % 99999;
    const transmittalNo = generateTransmittalNumber(credentials.hciAccreNo, seq);

    const year = batch.period.slice(0, 4);
    const monthIdx = parseInt(batch.period.slice(4, 6), 10) - 1;
    const periodDate = new Date(parseInt(year, 10), monthIdx, 1);
    const effYear = year;

    const enlistments: KonsultaEnlistmentData[] = batch.KonsultaEntries.map((entry) => {
        const p = entry.Patient;
        const dob = p.dob ? p.dob.toISOString().slice(0, 10) : "1990-01-01";
        const mobile = p.mobile ?? `09${entry.philHealthPin.slice(-9)}`;
        const transDate = periodDate.toISOString().slice(0, 10);
        const memberPin = entry.memberPin || entry.philHealthPin;

        return {
            pHciCaseNo: entry.hciCaseNo || formatKonsultaHciNumber("T", credentials.hciAccreNo, entry.id, periodDate),
            pHciTransNo: entry.hciTransNo || formatKonsultaHciNumber("E", credentials.hciAccreNo, entry.id, periodDate),
            pEffYear: effYear,
            pEnlistStat: "A",
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
            pPatientType: entry.memberType as "MM" | "DD",
            pPatientMobileNo: mobile,
            pPatientLandlineNo: "",
            pWithConsent: "Y",
            pTransDate: transDate,
            pCreatedBy: "ClinicEZ",
            pReportStatus: "U",
            pDeficiencyRemarks: "",
        };
    });

    const entryByConsultationId = new Map<number, (typeof batch.KonsultaEntries)[number]>();
    for (const entry of batch.KonsultaEntries) {
        for (const consultationId of entry.consultationIds) {
            entryByConsultationId.set(consultationId, entry);
        }
    }

    const consultationIds = Array.from(entryByConsultationId.keys());
    const consultationRows = batch.reportTagging === "2" && consultationIds.length > 0
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
                konsultaHciCaseNo: true,
                konsultaHciTransNo: true,
                konsultaAtc: true,
                Appointment: { select: { AppointmentAttribute: { select: { date: true, isWalkIn: true } } } },
            },
        })
        : [];

    const soaps: KonsultaSoapData[] = consultationRows.map((consultation) => {
        const entry = entryByConsultationId.get(consultation.id);
        if (!entry) throw new Error("Consultation is not attached to a batch entry.");
        const soapDate = (consultation.Appointment?.AppointmentAttribute?.date ?? consultation.createdAt)
            .toISOString()
            .slice(0, 10);
        const isWalkIn = consultation.Appointment?.AppointmentAttribute?.isWalkIn ? "Y" : "N";
        const transDate = consultation.createdAt.toISOString().slice(0, 10);
        const memberPin = entry.memberPin || entry.philHealthPin;

        return {
            pHciCaseNo: consultation.konsultaHciCaseNo || entry.hciCaseNo || formatKonsultaHciNumber("T", credentials.hciAccreNo, entry.id, periodDate),
            pHciTransNo: consultation.konsultaHciTransNo || formatKonsultaHciNumber("S", credentials.hciAccreNo, consultation.id, consultation.createdAt),
            pSoapDate: soapDate,
            pPatientPin: entry.philHealthPin,
            pPatientType: entry.memberType as KonsultaPatientType,
            pMemPin: memberPin,
            pEffYear: effYear,
            pATC: consultation.konsultaAtc || (isWalkIn === "Y" ? "WALKEDIN" : ""),
            pIsWalkedIn: isWalkIn,
            pCoPay: "0",
            pTransDate: transDate,
            pReportStatus: "U",
            pDeficiencyRemarks: "",
        };
    });

    if (batch.reportTagging === "2" && soaps.length === 0) {
        throw new Error("Second-tranche reports require at least one consultation SOAP entry.");
    }

    const xml = buildPcbXml({
        credentials,
        transmittalNumber: transmittalNo,
        enlistments: batch.reportTagging === "1" ? enlistments : [],
        profiles: [],
        soaps,
    });

    await prisma.konsultaBatch.update({
        where: { batchUid },
        data: {
            xmlPayload: xml,
            transmittalNo,
            status: "GENERATED",
            errorMessage: null,
        },
    });

    return { message: "XML generated successfully", data: { transmittalNo, xmlLength: xml.length } };
});

// ─── Validate + Submit ────────────────────────────────────────────────────────

export const submitKonsultaBatchAction = withErrorHandling(async (batchUid: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const batch = await prisma.konsultaBatch.findUnique({
        where: { batchUid },
        select: {
            id: true, clinicId: true, xmlPayload: true,
            transmittalNo: true, reportTagging: true, status: true,
        },
    });
    if (!batch) throw new Error("Batch not found");
    if (!batch.xmlPayload || !batch.transmittalNo) {
        throw new Error("Generate the XML first before submitting.");
    }
    if (batch.status === "SUBMITTED") throw new Error("Batch already submitted.");

    const credentials = await getClinicKonsultaCredentials(batch.clinicId);

    // Set status to VALIDATING
    await prisma.konsultaBatch.update({
        where: { batchUid },
        data: { status: "VALIDATED", errorMessage: null },
    });

    // Encrypt
    const encryptedPayload = encryptXmlPayload(batch.xmlPayload, credentials.cipherKey);

    // Call SOAP via standalone service functions
    const {
        getToken: konsultaGetToken,
        validateReport: konsultaValidateReport,
        submitReport: konsultaSubmitReport,
    } = await import("@/services/konsulta/konsulta-soap.service");

    // Get token
    const tokenRaw = await konsultaGetToken({
        pUsername: credentials.username,
        pUserPassword: credentials.password,
        pSoftwareCertificationId: credentials.certificationId,
        pHospitalCode: credentials.hciAccreNo,
    });
    let token = tokenRaw.return;
    try { token = (JSON.parse(token) as { result?: string }).result ?? token; } catch { /* plain string */ }

    // Validate
    const validateRaw = await konsultaValidateReport(
        {
            pReport: encryptedPayload,
            pReportTagging: batch.reportTagging as "1" | "2",
        },
        token
    );

    let validateResult: Prisma.InputJsonObject;
    try {
        let parsed = JSON.parse(validateRaw.return) as Record<string, unknown>;
        if (typeof parsed === "string") parsed = JSON.parse(parsed) as Record<string, unknown>;
        if (parsed.encryptedxml) delete parsed.encryptedxml;
        validateResult = toInputJsonObject(parsed);
    } catch {
        validateResult = { raw: validateRaw.return };
    }

    const isValid = JSON.stringify(validateResult).toLowerCase().includes('"v"') ||
        JSON.stringify(validateResult).toLowerCase().includes("valid");

    if (!isValid) {
        await prisma.konsultaBatch.update({
            where: { batchUid },
            data: {
                status: "FAILED",
                validateResult,
                errorMessage: "Validation failed — see validateResult for details",
            },
        });
        throw new Error("Validation failed. Check the batch detail for errors.");
    }

    // Submit
    const submitRaw = await konsultaSubmitReport(
        {
            pTransmittalID: batch.transmittalNo,
            pReport: encryptedPayload,
            pReportTagging: batch.reportTagging as "1" | "2",
        },
        token
    );

    let submitResult: Prisma.InputJsonObject;
    try {
        let parsed = JSON.parse(submitRaw.return) as Record<string, unknown>;
        if (typeof parsed === "string") parsed = JSON.parse(parsed) as Record<string, unknown>;
        if (parsed.encryptedxml) delete parsed.encryptedxml;
        // Parse nested errors JSON
        if (parsed.uploadxmlresult && typeof (parsed.uploadxmlresult as Record<string, unknown>).errors === "string") {
            try {
                (parsed.uploadxmlresult as Record<string, unknown>).errors = JSON.parse(
                    (parsed.uploadxmlresult as Record<string, unknown>).errors as string
                ) as unknown;
            } catch { /* leave as string */ }
        }
        submitResult = toInputJsonObject(parsed);
    } catch {
        submitResult = { raw: submitRaw.return };
    }

    await prisma.konsultaBatch.update({
        where: { batchUid },
        data: {
            status: "SUBMITTED",
            validateResult,
            submitResult,
            submittedAt: new Date(),
            errorMessage: null,
        },
    });

    return {
        message: "Batch submitted successfully",
        data: { validateResult, submitResult },
    };
});
