/**
 * Utility functions for PhilHealth Physical Examination (Pertinent Findings Per System)
 * Supporting multi-select findings and mutual exclusivity per PhilHealth SSVTG rev20260708 (Annex B.4).
 */

export const OTHERS_CODE = "99";

/**
 * Known "Essentially normal" or "Not Applicable" codes per PhilHealth library category
 */
export const ESSENTIALLY_NORMAL_CODES: Record<string, string[]> = {
  SKIN: ["1"],
  HEENT: ["11"],
  CHEST: ["6"],
  HEART: ["5", "2"], // 5 is current, 2 is legacy normal
  ABDOMEN: ["7"],
  NEURO: ["6", "3"], // 6 is current, 3 is legacy normal
  RECTAL: ["1", "0"], // 1 is Essentially normal, 0 is Not Applicable
  GU: ["1"],
};

/**
 * Parses a string, array, or null/undefined into a clean array of unique code strings.
 * Supports semicolon (;) or comma (,) delimiters.
 */
export function parsePeCodes(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .flatMap((v) => (typeof v === "string" ? v.split(/[;,]/) : String(v)))
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
  }
  return Array.from(
    new Set(
      String(value)
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

/**
 * Formats an array of codes into a semicolon-delimited string (e.g. "16;17;99").
 */
export function formatPeCodes(codes: string[] | string | null | undefined): string {
  const parsed = parsePeCodes(codes);
  return parsed.join(";");
}

/**
 * Checks whether a given code is considered "Essentially normal" or "Not Applicable"
 * for the specified category.
 */
export function isEssentiallyNormal(category: string, code: string, description?: string): boolean {
  if (description) {
    const descLower = description.toLowerCase();
    if (descLower.includes("essentially normal") || descLower.includes("not applicable")) {
      return true;
    }
  }
  const normalCodes = ESSENTIALLY_NORMAL_CODES[category.toUpperCase()] || [];
  return normalCodes.includes(code);
}

/**
 * Checks if a code is "Others" (99)
 */
export function isOthersCode(code: string): boolean {
  return code === OTHERS_CODE;
}

/**
 * Toggles a finding code with PhilHealth Annex B.4 mutual exclusivity:
 * - If "Essentially normal" is selected, all other options for that body system are cleared.
 * - If any abnormal option is selected, "Essentially normal" options are automatically cleared.
 */
export function togglePeFindingCode(
  category: string,
  currentCodes: string[],
  toggledCode: string,
  description?: string
): string[] {
  const isNormal = isEssentiallyNormal(category, toggledCode, description);
  const exists = currentCodes.includes(toggledCode);

  if (exists) {
    return currentCodes.filter((c) => c !== toggledCode);
  }

  if (isNormal) {
    // Selecting normal clears all other options
    return [toggledCode];
  }

  // Selecting any abnormal option clears normal options
  const normalCodes = ESSENTIALLY_NORMAL_CODES[category.toUpperCase()] || [];
  const cleaned = currentCodes.filter((c) => !normalCodes.includes(c));
  return [...cleaned, toggledCode];
}
