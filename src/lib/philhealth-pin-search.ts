import type { Prisma } from "@prisma/client";

/**
 * Matches queries that look like a PhilHealth PIN (full or partial, raw digits or dashed/spaced),
 * optionally prefixed with "PIN", "PHIC", or "PhilHealth".
 * Intentionally rejects mixed name+number strings like "Juan 2" or "john1@gmail.com"
 * to prevent false-positive digit substring matches.
 */
const PIN_LIKE_QUERY_REGEX =
  /^(?:(?:philhealth\s*pin|philhealth|phic|pin)\s*[:#-]?\s*)?([\d\s-]+)$/i;

/**
 * Formats up to 12 digits using the standard PhilHealth PIN mask: XX-XXXXXXXXX-X.
 */
function maskPinDigits(digits: string): string {
  const clean = digits.replace(/\D/g, "").slice(0, 12);
  if (clean.length <= 2) return clean;
  if (clean.length <= 11) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 11)}-${clean.slice(11, 12)}`;
}

/**
 * Formats a PhilHealth PIN for UI badges and labels (`XX-XXXXXXXXX-X` when 12 digits).
 */
export function formatPhilHealthPinDisplay(pin: string | null | undefined): string {
  if (!pin) return "";
  const trimmed = pin.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 12) {
    return maskPinDigits(digits);
  }
  return trimmed;
}

/**
 * Extracts normalized PhilHealth PIN search substrings from user search input.
 *
 * Examples:
 * - "19-027093981-7" -> ["190270939817", "19-027093981-7"]
 * - "190270939817"   -> ["190270939817", "19-027093981-7"]
 * - "027093981-7"    -> ["0270939817", "027093981-7", "02-70939817"]
 * - "Juan 2"         -> []
 */
export function extractPhilHealthPinSearchTerms(search: string): string[] {
  const trimmed = search.trim();
  if (!trimmed) return [];

  const match = PIN_LIKE_QUERY_REGEX.exec(trimmed);
  if (!match) return [];

  const rawBody = match[1].trim();
  const digits = rawBody.replace(/\D/g, "");

  // Require at least 2 digits to avoid noisy single-digit matches across all 12-digit PINs
  if (digits.length < 2) return [];

  const terms = new Set<string>();
  terms.add(digits);

  // Preserve hyphenated form (without spaces) in case any record stored dashed PINs
  const compactBody = rawBody.replace(/\s+/g, "");
  if (compactBody.length >= 2) {
    terms.add(compactBody);
  }

  // Also include standard XX-XXXXXXXXX-X masked form when 3..12 digits are entered
  if (digits.length > 2 && digits.length <= 12) {
    terms.add(maskPinDigits(digits));
  }

  return Array.from(terms);
}

/**
 * Builds Prisma `UserWhereInput` OR clauses for matching a patient by PhilHealth PIN
 * across `User.PhilHealthRecords`, `User.ClinicPatients` (`konsultaPatientPin` / `konsultaMemberPin`),
 * and `PhilHealthKonsultaEnlistment` (`memberPin` / `dependentPin`).
 */
export function buildUserPhilHealthPinOrFilters(
  search: string,
  options?: { clinicUid?: string; clinicId?: number }
): Prisma.UserWhereInput[] {
  const terms = extractPhilHealthPinSearchTerms(search);
  if (terms.length === 0) return [];

  return [
    {
      PhilHealthRecords: {
        some: {
          isActive: true,
          deletedAt: null,
          OR: terms.flatMap((term) => [
            { pin: { contains: term, mode: "insensitive" as const } },
            { principalMemberPin: { contains: term, mode: "insensitive" as const } },
          ]),
        },
      },
    },
    {
      ClinicPatients: {
        some: {
          isActive: true,
          deletedAt: null,
          ...(options?.clinicUid ? { Clinic: { clinicUid: options.clinicUid } } : {}),
          ...(options?.clinicId !== undefined ? { clinicId: options.clinicId } : {}),
          OR: [
            ...terms.flatMap((term) => [
              { konsultaPatientPin: { contains: term, mode: "insensitive" as const } },
              { konsultaMemberPin: { contains: term, mode: "insensitive" as const } },
            ]),
            {
              PhilHealthKonsultaEnlistments: {
                some: {
                  OR: terms.flatMap((term) => [
                    { memberPin: { contains: term, mode: "insensitive" as const } },
                    { dependentPin: { contains: term, mode: "insensitive" as const } },
                  ]),
                },
              },
            },
          ],
        },
      },
    },
  ];
}

export interface PhilHealthPinSource {
  philHealthPin?: string | null;
  konsultaPatientPin?: string | null;
  konsultaPatientType?: string | null;
  PhilHealthRecords?: Array<{ pin?: string | null }> | null;
  Patient?: {
    PhilHealthRecords?: Array<{ pin?: string | null }> | null;
  } | null;
  PhilHealthKonsultaEnlistments?: Array<{
    dependentPin?: string | null;
    memberPin?: string | null;
    patientType?: string | null;
  }> | null;
}

/**
 * Resolves the patient's own PhilHealth PIN for UI display badges.
 * Avoids misreporting a principal member's `memberPin` as a dependent's (`DD`) own PIN.
 */
export function resolvePatientPhilHealthPin(
  source: PhilHealthPinSource | null | undefined
): string | null {
  if (!source) return null;

  const candidates: Array<string | null | undefined> = [
    source.philHealthPin,
    source.PhilHealthRecords?.[0]?.pin,
    source.Patient?.PhilHealthRecords?.[0]?.pin,
    source.konsultaPatientPin,
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }

  const enlistment = source.PhilHealthKonsultaEnlistments?.[0];
  if (enlistment) {
    if (enlistment.dependentPin?.trim()) {
      return enlistment.dependentPin.trim();
    }
    const effectiveType = enlistment.patientType ?? source.konsultaPatientType;
    if (effectiveType !== "DD" && enlistment.memberPin?.trim()) {
      return enlistment.memberPin.trim();
    }
  }

  return null;
}

/**
 * Client-side helper to check whether any PIN associated with a patient matches a search string.
 */
export function matchesPhilHealthPinClient(
  pins: Array<string | null | undefined>,
  search: string
): boolean {
  const terms = extractPhilHealthPinSearchTerms(search);
  if (terms.length === 0) return false;

  const validPins = pins
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));

  if (validPins.length === 0) return false;

  return validPins.some((rawPin) => {
    const rawLower = rawPin.toLowerCase();
    const digitsOnly = rawPin.replace(/\D/g, "");
    return terms.some((term) => {
      const termLower = term.toLowerCase();
      return rawLower.includes(termLower) || (digitsOnly.length > 0 && digitsOnly.includes(termLower));
    });
  });
}
