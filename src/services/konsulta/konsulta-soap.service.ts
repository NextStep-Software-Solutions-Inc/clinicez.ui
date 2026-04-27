/**
 * PhilHealth Konsulta v1.1 PKA — SOAP Client Service
 *
 * Wraps node-soap to communicate with the PhilHealth Konsulta staging/production
 * SOAP service.
 *
 * WSDL:     https://staging.philhealth.gov.ph/KONSULTA/SOAP?wsdl
 * Endpoint: https://staging.philhealth.gov.ph/KONSULTA/SOAP
 *
 * NOTE: The WSDL's embedded XSD schemaLocation points to
 *   http://staging.philhealth.gov.ph:80/KONSULTA/SOAP?xsd=1
 * Port 80 refuses connections. We pre-fetch the WSDL ourselves, rewrite all
 * http://staging.philhealth.gov.ph:PORT/ references to https://, write the
 * patched WSDL to a temp file, and hand that to node-soap so it fetches the
 * XSD over HTTPS (port 443) instead of the refused port 80.
 */

import { createClientAsync, type Client } from "soap";
import https from "https";
import fs from "fs";
import path from "path";
import os from "os";
import type {
    CheckUploadStatusParams,
    CheckUploadStatusResponse,
    ValidateReportParams,
    ValidateReportResponse,
    SubmitReportParams,
    SubmitReportResponse,
    GetTokenParams,
    GetTokenResponse,
    ExtractRegistrationListParams,
    ExtractRegistrationListResponse,
    IsATCValidParams,
    IsATCValidResponse,
    IsMemberDependentRegisteredParams,
    IsMemberDependentRegisteredResponse,
} from "./types";

const WSDL_URL =
    process.env.PHILHEALTH_KONSULTA_WSDL_URL ??
    "https://staging.philhealth.gov.ph/KONSULTA/SOAP?wsdl";

const SOAP_ENDPOINT =
    process.env.PHILHEALTH_KONSULTA_ENDPOINT ??
    "https://staging.philhealth.gov.ph/KONSULTA/SOAP";

/** Timeout (ms) for WSDL fetch and individual SOAP method calls. */
const SOAP_TIMEOUT_MS = 20_000;

/** Path where the patched WSDL is cached so node-soap reads it locally. */
const PATCHED_WSDL_PATH = path.join(os.tmpdir(), "konsulta-staging-patched.wsdl");

// ─── WSDL pre-fetcher & patcher ──────────────────────────────────────────────

/** Fetch a URL over HTTPS ignoring certificate errors, return body as string. */
function fetchHttps(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = https.get(
            url,
            { rejectUnauthorized: false, timeout: SOAP_TIMEOUT_MS } as https.RequestOptions,
            (res) => {
                let body = "";
                res.on("data", (chunk: Buffer) => { body += chunk.toString(); });
                res.on("end", () => resolve(body));
                res.on("error", reject);
            }
        );
        req.on("timeout", () => { req.destroy(); reject(new Error("WSDL fetch timed out")); });
        req.on("error", reject);
    });
}

/**
 * Fetch the live WSDL, rewrite all http://staging…:PORT/ references to https://
 * so node-soap resolves XSD imports over HTTPS (port 443) not port 80.
 */
async function buildPatchedWsdl(): Promise<string> {
    const raw = await fetchHttps(WSDL_URL);
    return raw.replace(
        /http:\/\/staging\.philhealth\.gov\.ph(:\d+)?\//g,
        "https://staging.philhealth.gov.ph/"
    );
}

// ─── Client factory ───────────────────────────────────────────────────────────

let _clientCache: Client | null = null;

async function getClient(): Promise<Client> {
    if (_clientCache) return _clientCache;

    // Write the patched WSDL to a temp file on every cold start so
    // node-soap loads it locally and never hits port 80 for the XSD import.
    const patched = await buildPatchedWsdl();
    fs.writeFileSync(PATCHED_WSDL_PATH, patched, "utf8");

    const client = await createClientAsync(PATCHED_WSDL_PATH, {
        endpoint: SOAP_ENDPOINT,
        // wsdl_options covers any remaining remote fetches (e.g. XSD via HTTPS)
        wsdl_options: {
            rejectUnauthorized: false,
        },
        wsdl_headers: { Connection: "keep-alive" },
    });

    _clientCache = client;
    return client;
}

/**
 * Introspects the WSDL and returns all available operations.
 * Useful during development to discover the full operation set.
 */
export async function describeKonsultaService(): Promise<Record<string, unknown>> {
    const client = await getClient();
    return client.describe() as Record<string, unknown>;
}

// ─── Token header helper ─────────────────────────────────────────────────────

// node-soap client has addHttpHeader at runtime but it is not in the
// published TypeScript declarations — use a loose cast to access it.
interface SoapHttpExtensions {
    addHttpHeader(name: string, value: string): void;
    httpHeaders: Record<string, string> | null;
}

/**
 * Applies (or clears) the session token on the shared SOAP client.
 *
 * Despite the dev-kit wording saying "SOAP header", the PhilHealth JAX-WS
 * server reads the token from the **HTTP request header** named "Token", not
 * from the SOAP envelope <Header> element.  Evidence: the raw SOAP request
 * shows <Token xmlns="http://philhealth.gov.ph/">JWT</Token> correctly placed
 * inside <soap:Header>, yet the server still returns "Token is Required".
 * Switching to an HTTP header resolves this.
 *
 * IMPORTANT: Do NOT call client.clearHttpHeaders() — it sets httpHeaders to
 * null, and node-soap's request builder then does `headers = {}` which wipes
 * Content-Type, causing the server to reject the call with a 4xx error.
 * Instead, reset httpHeaders to an empty object so node-soap uses its normal
 * additive merge path and keeps Content-Type intact.
 */
function applyTokenHeader(client: Client, token: string | undefined): void {
    client.clearSoapHeaders();
    const c = client as unknown as SoapHttpExtensions;
    // Reset to {} (not null) to safely clear any previous Token header
    c.httpHeaders = {};
    if (token) {
        c.addHttpHeader("Token", token);
    }
}

// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * checkUploadStatus — check whether a previous submission was processed.
 *
 * @param params - Query parameters
 * @param token  - Access token from getToken()
 */
export async function checkUploadStatus(
    params: CheckUploadStatusParams,
    token?: string
): Promise<CheckUploadStatusResponse> {
    const client = await getClient();
    applyTokenHeader(client, token);
    const [result] = (await client.checkUploadStatusAsync(
        params,
        { timeout: SOAP_TIMEOUT_MS }
    )) as [CheckUploadStatusResponse];
    return result;
}

/**
 * validateReport — pre-validate an encrypted XML payload.
 *
 * Step 1 of the two-step upload workflow. Returns a transmittal ID to pass
 * to submitReport on success.
 *
 * @param params - pReportTagging (encrypted XML JSON) + pReport ("PCB"|"ML")
 * @param token  - Access token from getToken()
 */
export async function validateReport(
    params: ValidateReportParams,
    token?: string
): Promise<ValidateReportResponse> {
    const client = await getClient();
    applyTokenHeader(client, token);
    const [result] = (await client.validateReportAsync(
        params,
        { timeout: SOAP_TIMEOUT_MS }
    )) as [ValidateReportResponse];
    return result;
}

/**
 * submitReport — final submission after a successful validateReport.
 *
 * Step 2 of the two-step upload workflow.
 *
 * @param params - pTransmittalID (from validateReport), pReport, pReportTagging
 * @param token  - Access token from getToken()
 */
export async function submitReport(
    params: SubmitReportParams,
    token?: string
): Promise<SubmitReportResponse> {
    const client = await getClient();
    applyTokenHeader(client, token);
    const [result] = (await client.submitReportAsync(
        params,
        { timeout: SOAP_TIMEOUT_MS }
    )) as [SubmitReportResponse];
    return result;
}

/**
 * getToken — obtain a session access token.
 *
 * This is the only method that does NOT require a token header — it is how
 * you acquire the token in the first place.
 *
 * @param params - username, password, softwareCertificationId, hospitalCode
 */
export async function getToken(
    params: GetTokenParams
): Promise<GetTokenResponse> {
    const client = await getClient();
    // No token header for this call — it is what generates the token.
    // Reset to {} (not null) so Content-Type is preserved in the request.
    client.clearSoapHeaders();
    (client as unknown as SoapHttpExtensions).httpHeaders = {};
    const [result] = (await client.getTokenAsync(
        params,
        { timeout: SOAP_TIMEOUT_MS }
    )) as [GetTokenResponse];
    return result;
}

/**
 * extractRegistrationList — retrieve registered members/dependents in a date range.
 *
 * @param params - pStartDate, pEndDate
 * @param token  - Access token from getToken()
 */
export async function extractRegistrationList(
    params: ExtractRegistrationListParams,
    token?: string
): Promise<ExtractRegistrationListResponse> {
    const client = await getClient();
    applyTokenHeader(client, token);
    const [result] = (await client.extractRegistrationListAsync(
        params,
        { timeout: SOAP_TIMEOUT_MS }
    )) as [ExtractRegistrationListResponse];
    return result;
}

/**
 * isATCValid — verify an Authorization to Consult code.
 *
 * @param params - pPIN, pATC, pEffectivityDate
 * @param token  - Access token from getToken()
 */
export async function isATCValid(
    params: IsATCValidParams,
    token?: string
): Promise<IsATCValidResponse> {
    const client = await getClient();
    applyTokenHeader(client, token);
    const [result] = (await client.isATCValidAsync(
        params,
        { timeout: SOAP_TIMEOUT_MS }
    )) as [IsATCValidResponse];
    return result;
}

/**
 * isMemberDependentRegistered — check if a member/dependent is enrolled under Konsulta.
 * pType = "MM" (member) | "DD" (dependent)
 *
 * @param params - pPIN, pType
 * @param token  - Access token from getToken()
 */
export async function isMemberDependentRegistered(
    params: IsMemberDependentRegisteredParams,
    token?: string
): Promise<IsMemberDependentRegisteredResponse> {
    const client = await getClient();
    applyTokenHeader(client, token);
    const [result] = (await client.isMemberDependentRegisteredAsync(
        params,
        { timeout: SOAP_TIMEOUT_MS }
    )) as [IsMemberDependentRegisteredResponse];
    return result;
}

/**
 * Returns the raw SOAP XML of the most recent request made by the client.
 * Useful for debugging header/body format issues during development.
 */
export function getLastKonsultaRequest(): string | undefined {
    return (_clientCache as unknown as { lastRequest?: string })?.lastRequest;
}

/**
 * Clears the cached SOAP client singleton.
 * Call this if the WSDL endpoint changes (e.g. staging → production).
 */
export function resetKonsultaClient(): void {
    _clientCache = null;
}
