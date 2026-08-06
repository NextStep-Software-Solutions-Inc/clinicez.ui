/**
 * POST /api/konsulta/test-staging
 *
 * Admin-only endpoint for testing the PhilHealth Konsulta staging server.
 *
 * Actions:
 *   "ping"         — raw HTTP GET to SOAP endpoint (fastest connectivity check)
 *   "describe"     — fetch WSDL and list all available operations
 *   "check-status" — call checkUploadStatus with staging credentials
 *   "upload-test"  — build minimal PCB XML, encrypt it, and submit to staging
 *
 * Pass `resetClient: true` in the body to force a WSDL re-fetch.
 */

import http from "node:http";
import https from "node:https";
import { auth } from "@clerk/nextjs/server";
import prisma from "@lib/prisma";
import {
    isoToPhilHealthDate,
    parseErlXml,
} from "@services/konsulta/erl-parser";
import {
    checkUploadStatus,
    describeKonsultaService,
    extractRegistrationList,
    getLastKonsultaRequest,
    getLastKonsultaResponse,
    getToken,
    isMemberDependentRegistered,
    resetKonsultaClient,
    submitReport,
    validateReport,
} from "@services/konsulta/konsulta-soap.service";
import {
    buildStagingTestPcbXml,
    generateTransmittalNumber,
    STAGING_TEST_MEMBERS,
} from "@services/konsulta/pcb-xml-builder";
import type {
    ErlAssignment,
    KonsultaEncryptedPayload,
    KonsultaHciCredentials,
} from "@services/konsulta/types";
import {
    decryptXmlPayload,
    encryptXmlPayload,
} from "@services/konsulta/xml-encryption.service";
import { type NextRequest, NextResponse } from "next/server";

type TestAction =
    | "ping"
    | "describe"
    | "check-status"
    | "get-token"
    | "check-member"
    | "extract-registration"
    | "upload-test";

interface RequestBody {
    action: TestAction;
    clinicId?: number;
    resetClient?: boolean;
    /** PIN to pass to isMemberDependentRegistered (defaults to staging dummy 000000000000) */
    pin?: string;
    /** "MM" (member) or "DD" (dependent). Defaults to "MM". */
    memberType?: "MM" | "DD";
    /** Start date for extract-registration (defaults to 2020-01-01). */
    erlStartDate?: string;
    /** End date for extract-registration (defaults to today). */
    erlEndDate?: string;
}

const VALID_ACTIONS: TestAction[] = [
    "ping",
    "describe",
    "check-status",
    "get-token",
    "check-member",
    "extract-registration",
    "upload-test",
];

// ─── Raw connectivity ping ────────────────────────────────────────────────────

function rawPing(
    url: string,
    timeoutMs = 10_000,
): Promise<{ statusCode: number }> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const isHttps = parsed.protocol === "https:";
        const mod = isHttps ? https : http;
        const port = parsed.port ? Number(parsed.port) : isHttps ? 443 : 80;

        const options = {
            hostname: parsed.hostname,
            port,
            path: parsed.pathname + parsed.search,
            method: "GET",
            timeout: timeoutMs,
            headers: { "User-Agent": "ClinicEZ-Konsulta/1.0" },
            ...(isHttps ? { rejectUnauthorized: false } : {}),
        };

        const req = mod.request(options, (res) => {
            res.resume();
            resolve({ statusCode: res.statusCode ?? 0 });
        });
        req.on("timeout", () => {
            req.destroy();
            reject(new Error(`Ping timed out after ${timeoutMs}ms`));
        });
        req.on("error", reject);
        req.end();
    });
}

// ─── Credential resolver ──────────────────────────────────────────────────────

async function resolveCredentials(
    clinicId?: number,
): Promise<KonsultaHciCredentials> {
    if (clinicId) {
        const setting = await prisma.clinicSetting.findUnique({
            where: { clinicId },
            select: {
                philhealthAccreditationNumber: true,
                philhealthYakapUsername: true,
                philhealthYakapPassword: true,
                philhealthYakapPmccNumber: true,
            },
        });

        if (
            setting?.philhealthYakapUsername &&
            setting.philhealthYakapPassword &&
            setting.philhealthAccreditationNumber &&
            setting.philhealthYakapPmccNumber
        ) {
            return {
                username: setting.philhealthYakapUsername,
                password: setting.philhealthYakapPassword,
                hciAccreNo: setting.philhealthAccreditationNumber,
                pmccNumber: setting.philhealthYakapPmccNumber,
                certificationId: `KON-DUMMYCERTS-${setting.philhealthYakapPmccNumber}`,
                cipherKey:
                    process.env.PHILHEALTH_KONSULTA_CIPHER_KEY ?? "",
            };
        }
    }
    return {
        username: process.env.PHILHEALTH_KONSULTA_USERNAME ?? "",
        password: process.env.PHILHEALTH_KONSULTA_PASSWORD ?? "",
        hciAccreNo: process.env.PHILHEALTH_KONSULTA_HCI_ACCRE_NO ?? "",
        pmccNumber: process.env.PHILHEALTH_KONSULTA_PMCC_NO ?? "",
        certificationId:
            process.env.PHILHEALTH_KONSULTA_CERT_ID ?? "",
        cipherKey:
            process.env.PHILHEALTH_KONSULTA_CIPHER_KEY ?? "",
    };
}

// ─── Token helpers ──────────────────────────────────────────────────────────

/**
 * PhilHealth getToken returns a JSON envelope:
 *   { "message": "OK", "result": "<JWT>", "success": true }
 *
 * Extract the actual JWT from `result`, falling back to the raw string if the
 * response is not JSON (e.g. a plain error message).
 */
function extractJwt(raw: string): string {
    try {
        const parsed = JSON.parse(raw) as { result?: string };
        return parsed.result ?? raw;
    } catch {
        return raw;
    }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 },
        );
    }

    // const user = await prisma.user.findUnique({
    //     where: { userId },
    //     select: {
    //         UserPermissions: {
    //             where: { Permission: { name: "SUPER_ADMIN", isActive: true } },
    //             select: { id: true },
    //         },
    //     },
    // });

    // if (!user || user.UserPermissions.length === 0) {
    //     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    let body: RequestBody;
    try {
        body = (await request.json()) as RequestBody;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { action, clinicId, resetClient, pin, memberType } = body;

    if (!VALID_ACTIONS.includes(action)) {
        return NextResponse.json(
            { error: `Invalid action. Use one of: ${VALID_ACTIONS.join(", ")}.` },
            { status: 400 },
        );
    }

    // Only reset the cached SOAP client when explicitly requested
    if (resetClient) resetKonsultaClient();

    const wsdlUrl =
        process.env.PHILHEALTH_KONSULTA_WSDL_URL ??
        "https://staging.philhealth.gov.ph/KONSULTA/SOAP?wsdl";
    const soapEndpoint =
        process.env.PHILHEALTH_KONSULTA_ENDPOINT ??
        "https://staging.philhealth.gov.ph/KONSULTA/SOAP";

    // ── Step 1: raw ping (all actions run this first) ──
    const pingResult: { ok: boolean; statusCode?: number; error?: string } = {
        ok: false,
    };
    try {
        const pong = await rawPing(soapEndpoint);
        pingResult.ok = true;
        pingResult.statusCode = pong.statusCode;
    } catch (err) {
        pingResult.error =
            err instanceof Error
                ? `${err.message} (code: ${(err as NodeJS.ErrnoException).code ?? "unknown"})`
                : String(err);
    }

    if (action === "ping") {
        return NextResponse.json({
            ok: pingResult.ok,
            step: "ping",
            endpoint: soapEndpoint,
            ping: pingResult,
        });
    }

    // ── Step 2: WSDL fetch + describe ──
    let describeResult: { ok: boolean; operations?: unknown; error?: string } = {
        ok: false,
    };
    try {
        const description = await describeKonsultaService();
        describeResult = { ok: true, operations: description };
    } catch (err) {
        describeResult.error =
            err instanceof Error
                ? `${err.message} (code: ${(err as NodeJS.ErrnoException).code ?? "unknown"})`
                : String(err);
    }

    if (action === "describe") {
        return NextResponse.json({
            ok: describeResult.ok,
            step: "describe",
            wsdlUrl,
            ping: pingResult,
            describe: describeResult,
        });
    }

    if (!describeResult.ok) {
        return NextResponse.json(
            {
                ok: false,
                step: "describe",
                error: "WSDL fetch failed — cannot proceed to SOAP call",
                ping: pingResult,
                describe: describeResult,
            },
            { status: 502 },
        );
    }

    // ── Step 3: SOAP call ──
    const credentials = await resolveCredentials(clinicId);

    try {
        if (action === "check-status") {
            const todayPhilHealth = isoToPhilHealthDate(
                new Date().toISOString().slice(0, 10),
            );
            const result = await checkUploadStatus({
                pUsername: credentials.username,
                pUserPassword: credentials.password,
                pHospitalCode: credentials.hciAccreNo,
                pStartDate: todayPhilHealth,
                pEndDate: todayPhilHealth,
                pTransmittalID: "",
                pReport: "PCB",
            });
            return NextResponse.json({
                ok: true,
                step: "check-status",
                result,
                ping: pingResult,
            });
        }

        if (action === "get-token") {
            const result = await getToken({
                pUsername: credentials.username,
                pUserPassword: credentials.password,
                pSoftwareCertificationId: credentials.certificationId,
                pHospitalCode: credentials.hciAccreNo,
            });
            return NextResponse.json({
                ok: true,
                step: "get-token",
                result,
                ping: pingResult,
            });
        }

        if (action === "check-member") {
            // The PhilHealth API requires a session token in the SOAP header.
            // Obtain it first, then inject it into the isMemberDependentRegistered call.
            const tokenResult = await getToken({
                pUsername: credentials.username,
                pUserPassword: credentials.password,
                pSoftwareCertificationId: credentials.certificationId,
                pHospitalCode: credentials.hciAccreNo,
            });
            const sessionToken = extractJwt(tokenResult.return);

            const result = await isMemberDependentRegistered(
                {
                    pPIN: pin ?? "000000000000",
                    pType: memberType ?? "MM",
                },
                sessionToken,
            );
            return NextResponse.json({
                ok: true,
                step: "check-member",
                pin: pin ?? "000000000000",
                memberType: memberType ?? "MM",
                token: sessionToken,
                result,
                rawSoapRequest: getLastKonsultaRequest(),
                ping: pingResult,
            });
        }

        if (action === "extract-registration") {
            const tokenResult = await getToken({
                pUsername: credentials.username,
                pUserPassword: credentials.password,
                pSoftwareCertificationId: credentials.certificationId,
                pHospitalCode: credentials.hciAccreNo,
            });
            const sessionToken = extractJwt(tokenResult.return);

            const todayStr = isoToPhilHealthDate(
                new Date().toISOString().slice(0, 10),
            );
            const erlResult = await extractRegistrationList(
                {
                    pStartDate: body.erlStartDate
                        ? isoToPhilHealthDate(body.erlStartDate)
                        : "01/01/2010",
                    pEndDate: body.erlEndDate
                        ? isoToPhilHealthDate(body.erlEndDate)
                        : todayStr,
                },
                sessionToken,
            );
            console.log({ erlResult });
            const firstMember = parseErlXml(erlResult.return);
            return NextResponse.json({
                ok: true,
                step: "extract-registration",
                token: sessionToken,
                firstMember,
                erlRaw: erlResult.return.slice(0, 2000),
                rawSoapRequest: getLastKonsultaRequest(),
                rawSoapResponse: getLastKonsultaResponse(),
                ping: pingResult,
            });
        }

        // action === "upload-test"
        // Use real HCI credentials for getToken — the server uses the JWT to identify the HCI
        // and look up its cipher key for decryption. Token and cipher key must be from the same HCI.
        const uploadTokenResult = await getToken({
            pUsername: credentials.username,
            pUserPassword: credentials.password,
            pSoftwareCertificationId: credentials.certificationId,
            pHospitalCode: credentials.hciAccreNo,
        });
        const uploadToken = extractJwt(uploadTokenResult.return);

        // Use seconds mod 99999 as seq so each test run produces a unique transmittal number
        const transmittalNumber = generateTransmittalNumber(
            credentials.hciAccreNo,
            Math.floor(Date.now() / 1000) % 99999,
        );

        // Call ERL to find a real registered member to use in the PCB XML.
        // This lets the server validate against an actual registrant rather
        // than the Annex B demo PINs (which may not be in our HCI's registry).
        let erlMember: ErlAssignment | null = null;
        let erlNote: string;
        try {
            const todayStr = isoToPhilHealthDate(
                new Date().toISOString().slice(0, 10),
            );
            const erlResult = await extractRegistrationList(
                {
                    pStartDate: "01/01/2020",
                    pEndDate: todayStr,
                },
                uploadToken,
            );
            erlMember = parseErlXml(erlResult.return);
            erlNote = erlMember
                ? `ERL: using member ${erlMember.pAssignedPin} (${erlMember.pAssignedType})`
                : `ERL returned no members — using YNXTSTP fallback (${STAGING_TEST_MEMBERS[0].pAssignedPin})`;
        } catch (erlErr) {
            erlNote = `ERL failed (${erlErr instanceof Error ? erlErr.message : String(erlErr)}) — using YNXTSTP fallback (${STAGING_TEST_MEMBERS[0].pAssignedPin})`;
        }

        const xml = buildStagingTestPcbXml(
            credentials,
            transmittalNumber,
            pin,
            erlMember ?? STAGING_TEST_MEMBERS[0],
        );
        const encryptedJson = encryptXmlPayload(xml, credentials.cipherKey);
        const validateResult = await validateReport(
            {
                pReport: encryptedJson,
                pReportTagging: "1",
            },
            uploadToken,
        );

        // Parse the validate response — server returns a JSON string
        interface ValidateResponse {
            success: boolean;
            message: string;
            encryptedxml: KonsultaEncryptedPayload | null;
            encryptedxmlerrors: KonsultaEncryptedPayload | null;
        }
        let validateParsed: ValidateResponse | null = null;
        try {
            validateParsed = JSON.parse(validateResult.return) as ValidateResponse;
        } catch {
            // raw string response — not JSON
        }
        const validationPassed = validateParsed?.success === true;

        // Decrypt the validation errors — server encrypts responses with the same HCI cipher key
        let validationErrors: string | null = null;
        if (!validationPassed && validateParsed?.encryptedxmlerrors) {
            try {
                validationErrors = decryptXmlPayload(
                    JSON.stringify(validateParsed.encryptedxmlerrors),
                    credentials.cipherKey,
                );
            } catch {
                validationErrors = "(failed to decrypt encryptedxmlerrors)";
            }
        }

        // Only submit if validation passed
        let submitResult: { return: string } | null = null;
        if (validationPassed) {
            submitResult = await submitReport(
                {
                    pTransmittalID: transmittalNumber,
                    pReport: encryptedJson,
                    pReportTagging: "1",
                },
                uploadToken,
            );
        }

        // Parse submit response — the SOAP wrapper has a `return` string which is
        // itself a JSON string, so we need two levels of JSON.parse.
        // Strip large encryptedxml blobs before returning.
        let submitParsed: Record<string, unknown> | null = null;
        if (submitResult) {
            try {
                // First level: unwrap the SOAP `return` string
                let inner: unknown = submitResult.return;
                if (typeof inner === "string") inner = JSON.parse(inner);
                // Second level: some servers double-encode the payload
                if (typeof inner === "string") inner = JSON.parse(inner);
                const raw = inner as Record<string, unknown>;
                const { encryptedxml: _sv, ...rest } = raw;
                void _sv;
                // Also parse the nested JSON string in uploadxmlresult.errors if present
                if (
                    rest.uploadxmlresult &&
                    typeof (rest.uploadxmlresult as Record<string, unknown>).errors ===
                    "string"
                ) {
                    try {
                        (rest.uploadxmlresult as Record<string, unknown>).errors =
                            JSON.parse(
                                (rest.uploadxmlresult as Record<string, unknown>)
                                    .errors as string,
                            );
                    } catch {
                        /* leave as string if not valid JSON */
                    }
                }
                submitParsed = rest;
            } catch {
                submitParsed = { raw: submitResult.return };
            }
        }

        // Strip large encryptedxml blobs from validate response too
        const validateSummary = validateParsed
            ? {
                success: validateParsed.success,
                message: validateParsed.message,
                encryptedxmlerrors: validateParsed.encryptedxmlerrors,
            }
            : validateResult.return;

        return NextResponse.json({
            ok: validationPassed,
            step: "upload-test",
            token: uploadToken,
            transmittalNumber,
            erlNote,
            erlMember,
            validate: validateSummary,
            validationErrors,
            submit: submitParsed ?? {
                skipped: true,
                reason: "validateReport did not return success:true",
            },
            xmlPreview: xml.slice(0, 500) + (xml.length > 500 ? "…" : ""),
            rawSoapRequest: getLastKonsultaRequest(),
            rawSoapResponse: getLastKonsultaResponse(),
            ping: pingResult,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const code = (err as NodeJS.ErrnoException).code;
        const soapFaultBody = (err as { body?: string }).body;
        return NextResponse.json(
            {
                ok: false,
                step: action,
                error: message,
                code,
                soapFaultBody: soapFaultBody ?? null,
                rawSoapRequest: getLastKonsultaRequest(),
                rawSoapResponse: getLastKonsultaResponse(),
                hint:
                    code === "ECONNRESET" || message.includes("socket hang up")
                        ? "The staging server dropped the connection. The server may be down, behind a firewall, or blocking this IP. Try action=ping first to check raw connectivity."
                        : undefined,
                ping: pingResult,
            },
            { status: 502 },
        );
    }
}
