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

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import http from "http";
import https from "https";
import prisma from "@lib/prisma";
import {
    describeKonsultaService,
    checkUploadStatus,
    validateReport,
    submitReport,
    getToken,
    isMemberDependentRegistered,
    getLastKonsultaRequest,
    resetKonsultaClient,
} from "@services/konsulta/konsulta-soap.service";
import { encryptXmlPayload } from "@services/konsulta/xml-encryption.service";
import { buildStagingTestPcbXml } from "@services/konsulta/pcb-xml-builder";
import type { KonsultaHciCredentials } from "@services/konsulta/types";

type TestAction = "ping" | "describe" | "check-status" | "get-token" | "check-member" | "upload-test";

interface RequestBody {
    action: TestAction;
    clinicId?: number;
    resetClient?: boolean;
    /** PIN to pass to isMemberDependentRegistered (defaults to staging dummy 000000000000) */
    pin?: string;
    /** "MM" (member) or "DD" (dependent). Defaults to "MM". */
    memberType?: "MM" | "DD";
}

const VALID_ACTIONS: TestAction[] = ["ping", "describe", "check-status", "get-token", "check-member", "upload-test"];

// ─── Raw connectivity ping ────────────────────────────────────────────────────

function rawPing(url: string, timeoutMs = 10_000): Promise<{ statusCode: number }> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const isHttps = parsed.protocol === "https:";
        const mod = isHttps ? https : http;
        const port = parsed.port
            ? Number(parsed.port)
            : isHttps ? 443 : 80;

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
        req.on("timeout", () => { req.destroy(); reject(new Error(`Ping timed out after ${timeoutMs}ms`)); });
        req.on("error", reject);
        req.end();
    });
}

// ─── Credential resolver ──────────────────────────────────────────────────────

async function resolveCredentials(
    clinicId?: number
): Promise<KonsultaHciCredentials> {
    if (clinicId) {
        const setting = await prisma.clinicSetting.findUnique({
            where: { clinicId },
            select: {
                philhealthAccreditationNumber: true,
                konsultaUsername: true,
                konsultaPassword: true,
                pmccNumber: true,
                konsultaCipherKey: true,
            },
        });

        if (
            setting?.konsultaUsername &&
            setting.konsultaPassword &&
            setting.philhealthAccreditationNumber &&
            setting.pmccNumber &&
            setting.konsultaCipherKey
        ) {
            return {
                username: setting.konsultaUsername,
                password: setting.konsultaPassword,
                hciAccreNo: setting.philhealthAccreditationNumber,
                pmccNumber: setting.pmccNumber,
                certificationId: `KON-DUMMYCERTS-${setting.pmccNumber}`,
                cipherKey: setting.konsultaCipherKey,
            };
        }
    }

    return {
        username: process.env.PHILHEALTH_KONSULTA_USERNAME ?? "",
        password: process.env.PHILHEALTH_KONSULTA_PASSWORD ?? "",
        hciAccreNo: process.env.PHILHEALTH_KONSULTA_HCI_ACCRE_NO ?? "P10038831",
        pmccNumber: process.env.PHILHEALTH_KONSULTA_PMCC_NO ?? "Z15445",
        certificationId:
            process.env.PHILHEALTH_KONSULTA_CERT_ID ?? "KON-DUMMYCERTS-Z15445",
        cipherKey:
            process.env.PHILHEALTH_KONSULTA_CIPHER_KEY ?? "PHilheaLthDuMmyZ15445",
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
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { userId },
        select: {
            UserPermissions: {
                where: { Permission: { name: "SUPER_ADMIN", isActive: true } },
                select: { id: true },
            },
        },
    });

    if (!user || user.UserPermissions.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
            { status: 400 }
        );
    }

    // Only reset the cached SOAP client when explicitly requested
    if (resetClient) resetKonsultaClient();

    const wsdlUrl = process.env.PHILHEALTH_KONSULTA_WSDL_URL ?? "https://staging.philhealth.gov.ph/KONSULTA/SOAP?wsdl";
    const soapEndpoint = process.env.PHILHEALTH_KONSULTA_ENDPOINT ?? "https://staging.philhealth.gov.ph/KONSULTA/SOAP";

    // ── Step 1: raw ping (all actions run this first) ──
    const pingResult: { ok: boolean; statusCode?: number; error?: string } = { ok: false };
    try {
        const pong = await rawPing(soapEndpoint);
        pingResult.ok = true;
        pingResult.statusCode = pong.statusCode;
    } catch (err) {
        pingResult.error = err instanceof Error ? `${err.message} (code: ${(err as NodeJS.ErrnoException).code ?? "unknown"})` : String(err);
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
    let describeResult: { ok: boolean; operations?: unknown; error?: string } = { ok: false };
    try {
        const description = await describeKonsultaService();
        describeResult = { ok: true, operations: description };
    } catch (err) {
        describeResult.error = err instanceof Error
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
        return NextResponse.json({
            ok: false,
            step: "describe",
            error: "WSDL fetch failed — cannot proceed to SOAP call",
            ping: pingResult,
            describe: describeResult,
        }, { status: 502 });
    }

    // ── Step 3: SOAP call ──
    const credentials = await resolveCredentials(clinicId);

    try {
        if (action === "check-status") {
            const today = new Date().toISOString().slice(0, 10);
            const result = await checkUploadStatus({
                pUsername: credentials.username,
                pUserPassword: credentials.password,
                pHospitalCode: credentials.hciAccreNo,
                pStartDate: today,
                pEndDate: today,
                pTransmittalID: "",
                pReport: "PCB",
            });
            return NextResponse.json({ ok: true, step: "check-status", result, ping: pingResult });
        }

        if (action === "get-token") {
            const result = await getToken({
                pUsername: credentials.username,
                pUserPassword: credentials.password,
                pSoftwareCertificationId: credentials.certificationId,
                pHospitalCode: credentials.hciAccreNo,
            });
            return NextResponse.json({ ok: true, step: "get-token", result, ping: pingResult });
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
                sessionToken
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

        // action === "upload-test"
        // Obtain a token first, then two-step: validateReport → submitReport
        const uploadTokenResult = await getToken({
            pUsername: credentials.username,
            pUserPassword: credentials.password,
            pSoftwareCertificationId: credentials.certificationId,
            pHospitalCode: credentials.hciAccreNo,
        });
        const uploadToken = extractJwt(uploadTokenResult.return);

        const xml = buildStagingTestPcbXml(credentials);
        const encryptedJson = encryptXmlPayload(xml, credentials.cipherKey);
        console.log({ xml, encryptedJson });
        const validateResult = await validateReport({
            pReportTagging: encryptedJson,
            pReport: "PCB",
        }, uploadToken);

        // Parse the transmittal ID out of the validate response
        const transmittalId = validateResult.return ?? "";

        const submitResult = await submitReport({
            pTransmittalID: transmittalId,
            pReport: "PCB",
            pReportTagging: encryptedJson,
        }, uploadToken);

        return NextResponse.json({
            ok: true,
            step: "upload-test",
            token: uploadToken,
            validateResult,
            submitResult,
            xmlPreview: xml.slice(0, 500) + (xml.length > 500 ? "…" : ""),
            ping: pingResult,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const code = (err as NodeJS.ErrnoException).code;
        return NextResponse.json({
            ok: false,
            step: action,
            error: message,
            code,
            hint: code === "ECONNRESET" || message.includes("socket hang up")
                ? "The staging server dropped the connection. The server may be down, behind a firewall, or blocking this IP. Try action=ping first to check raw connectivity."
                : undefined,
            ping: pingResult,
        }, { status: 502 });
    }
}
