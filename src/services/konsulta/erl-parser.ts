/**
 * PhilHealth Konsulta v1.1 PKA — ERL (Extract Registration List) XML Parser
 *
 * Shared utility used by the staging test API route and the PIN verification
 * server action to parse extractRegistrationList SOAP responses.
 */

import type { ErlAssignment } from "./types";

/**
 * Convert a PhilHealth MM/DD/YYYY date string to ISO YYYY-MM-DD.
 * Returns the original string if the format is not recognised.
 */
export function erlDateToIso(date: string): string {
    const parts = date.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
        const [m, d, y] = parts;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return date;
}

/**
 * Convert a local ISO date (YYYY-MM-DD) to PhilHealth MM/DD/YYYY format.
 */
export function isoToPhilHealthDate(isoDate: string): string {
    const [y, m, d] = isoDate.split("-");
    return `${m}/${d}/${y}`;
}

/**
 * Extract a single matching ASSIGNMENT element from an extractRegistrationList
 * SOAP response.
 *
 * The response may be:
 *  - A raw XML string
 *  - A JSON envelope: `{ "message": "...", "result": "<xml>", "success": true }`
 *
 * @param raw     The raw `{return}` value from the SOAP call.
 * @param pinFilter Optional PIN to filter by (pAssignedPin or pPrimaryPIN).
 * @returns       The matching assignment or `null` if not found.
 */
export function parseErlXml(raw: string, pinFilter?: string): ErlAssignment | null {
    let xml = raw;

    // Handle JSON envelope (some PhilHealth methods wrap XML in a JSON result)
    try {
        const parsed = JSON.parse(raw) as { result?: string; success?: boolean };
        if (!parsed.success) return null;
        if (parsed.result) xml = parsed.result;
    } catch {
        /* not JSON — raw string is the XML */
    }

    // Extract all ASSIGNMENT elements
    const candidates = [...xml.matchAll(/<ASSIGNMENT\s([\s\S]*?)(?:\/>|>)/g)];
    if (candidates.length === 0) return null;

    const makeAssignment = (attrStr: string): ErlAssignment => {
        const get = (name: string): string =>
            new RegExp(`${name}="([^"]*)"`, "i").exec(attrStr)?.[1] ?? "";
        return {
            pAssignedPin: get("pAssignedPin"),
            pAssignedLastName: get("pAssignedLastName"),
            pAssignedFirstName: get("pAssignedFirstName"),
            pAssignedMiddleName: get("pAssignedMiddleName"),
            pAssignedExtName: get("pAssignedExtName"),
            pAssignedDateOfBirth: get("pAssignedDateOfBirth"),
            pAssignedSex: get("pAssignedSex") as "M" | "F",
            pAssignedType: get("pAssignedType") as "MM" | "DD",
            pPrimaryPIN: get("pPrimaryPIN"),
            pPrimaryLastName: get("pPrimaryLastName"),
            pPrimaryFirstName: get("pPrimaryFirstName"),
            pPrimaryMiddleName: get("pPrimaryMiddleName"),
            pPrimaryExtName: get("pPrimaryExtName"),
            pPrimaryDateOfBirth: get("pPrimaryDateOfBirth"),
            pMobileNumber: get("pMobileNumber"),
            pPackageType: (get("pPackageType") || "K") as "E" | "K",
            pEffYear: get("pEffYear"),
            pAssignedDate: get("pAssignedDate"),
        };
    };

    // If a PIN filter is given, find the specific member
    if (pinFilter) {
        const normalised = pinFilter.replace(/\D/g, "");
        const match = candidates.find(m => {
            const a = makeAssignment(m[1]);
            return a.pAssignedPin.replace(/\D/g, "") === normalised;
        });
        if (match) return makeAssignment(match[1]);
        return null;
    }

    // Otherwise prefer the active record (pAssignedStatus="1"), fall back to first
    const active =
        candidates.find(m => /pAssignedStatus="1"/i.test(m[1])) ?? candidates[0];
    return makeAssignment(active[1]);
}

/**
 * Normalise a name string: trim, uppercase, remove diacritics, collapse spaces.
 */
function normaliseName(s: string): string {
    return (s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export interface PinIdentityMatchResult {
    /** "VERIFIED" — enrolled and all identity fields match */
    status: "VERIFIED" | "MISMATCH" | "NOT_FOUND" | "FAILED";
    enrolled: boolean;
    /** Discrepancies found, keyed by field name */
    discrepancies: Record<string, { expected: string; received: string }>;
    /** The ERL assignment record as received from PhilHealth (if found) */
    erlRecord: ErlAssignment | null;
}

/**
 * Compare a patient's local identity record against an ERL ASSIGNMENT.
 *
 * @param local    Patient data from the database.
 * @param erl      The ASSIGNMENT element found in the ERL response.
 */
export function compareIdentity(
    local: {
        firstName: string;
        lastName: string;
        middleName?: string | null;
        dob?: string | null;          // ISO YYYY-MM-DD
        gender?: string | null;       // "M" | "F" | "MALE" | "FEMALE" etc.
    },
    erl: ErlAssignment
): Pick<PinIdentityMatchResult, "status" | "discrepancies"> {
    const discrepancies: Record<string, { expected: string; received: string }> = {};

    const check = (field: string, local: string, remote: string): void => {
        if (normaliseName(local) !== normaliseName(remote)) {
            discrepancies[field] = { expected: local, received: remote };
        }
    };

    check("lastName", local.lastName, erl.pAssignedLastName);
    check("firstName", local.firstName, erl.pAssignedFirstName);

    if (local.dob) {
        const localDob = local.dob.slice(0, 10); // ensure YYYY-MM-DD
        const erlDob = erlDateToIso(erl.pAssignedDateOfBirth).slice(0, 10);
        if (localDob !== erlDob) {
            discrepancies["dateOfBirth"] = { expected: localDob, received: erlDob };
        }
    }

    if (local.gender) {
        const normaliseGender = (g: string): "M" | "F" | "" => {
            const u = g.toUpperCase();
            if (u === "M" || u === "MALE") return "M";
            if (u === "F" || u === "FEMALE") return "F";
            return "";
        };
        const localSex = normaliseGender(local.gender);
        const erlSex = erl.pAssignedSex;
        if (localSex && erlSex && localSex !== erlSex) {
            discrepancies["sex"] = { expected: localSex, received: erlSex };
        }
    }

    return {
        status: Object.keys(discrepancies).length === 0 ? "VERIFIED" : "MISMATCH",
        discrepancies,
    };
}
