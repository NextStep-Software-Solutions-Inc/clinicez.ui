export interface SubjectiveStructuredData {
  illnessHistory: string;
  signsSymptoms: string;
  painSite: string;
  otherComplaint: string;
}

/**
 * PhilHealth Konsulta v1.1 Data Dictionary byte/character limits for `<SUBJECTIVE>`.
 */
export const SUBJECTIVE_MAX_LENGTH = {
  illnessHistory: 2000,
  signsSymptoms: 2000,
  otherComplaint: 2000,
  painSite: 500,
} as const;

export const PAIN_SYMPTOM_CODE = "38";
export const OTHERS_SYMPTOM_CODE = "X";

/**
 * Converts Markdown clinical notes into clean plain text suitable for
 * History of Illness hydration and PhilHealth XML export.
 */
export function stripMarkdownToPlainText(markdown?: string | null): string {
  if (!markdown) return "";

  let text = String(markdown).replace(/\r\n?/g, "\n");

  // Strip fenced code block markers while keeping code contents
  text = text.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, "$1");
  text = text.replace(/```/g, "");

  // Images and links: keep alt/label text
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Line-level Markdown prefixes (headings, blockquotes, horizontal rules, lists)
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  text = text.replace(/^\s{0,3}>\s?/gm, "");
  text = text.replace(/^\s*([-*_])(?:\s*\1){2,}\s*$/gm, "");
  text = text.replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+[.)]\s+/gm, "");

  // Inline formatting (code, bold+italic, bold, italic, strikethrough)
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/\*\*\*([^*\n]+)\*\*\*/g, "$1");
  text = text.replace(/___([^_\n]+)___/g, "$1");
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "$1");
  text = text.replace(/__([^_\n]+)__/g, "$1");
  text = text.replace(/(^|[^\w])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?=[^\w]|$)/g, "$1$2");
  text = text.replace(/(^|[^\w])_([^\s_](?:[^_\n]*?[^\s_])?)_(?=[^\w]|$)/g, "$1$2");
  text = text.replace(/~~([^~\n]+)~~/g, "$1");

  // Clean up whitespace per line and collapse excessive blank lines
  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

/**
 * Checks whether a raw `signsSymptoms` string consists solely of delimited
 * PhilHealth symptom codes (digits and/or `X`, separated by `;` or `,`).
 */
export function isSignsSymptomsCodeList(value?: string | null): boolean {
  if (!value) return true;
  return /^[\dX\s,;]+$/i.test(String(value));
}

/**
 * Parses a semicolon/comma-delimited PhilHealth `signsSymptoms` string into
 * deduplicated, normalized codes (e.g., `"1"` -> `"01"`, `"x"` -> `"X"`).
 */
export function parseSignsSymptomsCodes(value?: string | null): string[] {
  if (!value) return [];
  const raw = String(value);
  if (!isSignsSymptomsCodeList(raw)) return [];

  const tokens = raw
    .split(/[,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .map((s) => (/^\d+$/.test(s) ? s.padStart(2, "0") : s));

  return Array.from(new Set(tokens));
}

/**
 * Formats live user input for controlled React fields: uppercases and enforces
 * Data Dictionary max length WITHOUT trimming trailing spaces so clinicians can type naturally.
 */
export function formatSubjectiveInput(value: string, maxLength: number): string {
  return value.toUpperCase().slice(0, maxLength);
}

/**
 * Trims, uppercases, and truncates text to PhilHealth Data Dictionary limits
 * for persisted normalization, comparison, and XML export.
 */
export function normalizeSubjectiveText(
  value?: string | null,
  maxLength?: number
): string {
  if (!value) return "";
  const normalized = String(value).trim().toUpperCase();
  return maxLength !== undefined ? normalized.slice(0, maxLength) : normalized;
}

/**
 * Normalizes structured subjective data for persistence, clearing conditional fields
 * (`painSite` when `38` is inactive, `otherComplaint` when `X` is inactive)
 * and enforcing uppercase + Data Dictionary length caps.
 */
export function sanitizeStructuredDataForStorage(
  data: Partial<SubjectiveStructuredData> | null | undefined
): SubjectiveStructuredData {
  const codes = parseSignsSymptomsCodes(data?.signsSymptoms);
  const hasPain = codes.includes(PAIN_SYMPTOM_CODE);
  const hasOthers = codes.includes(OTHERS_SYMPTOM_CODE);

  return {
    illnessHistory: normalizeSubjectiveText(
      data?.illnessHistory,
      SUBJECTIVE_MAX_LENGTH.illnessHistory
    ),
    signsSymptoms: codes.join(";").slice(0, SUBJECTIVE_MAX_LENGTH.signsSymptoms),
    painSite: hasPain
      ? normalizeSubjectiveText(data?.painSite, SUBJECTIVE_MAX_LENGTH.painSite)
      : "",
    otherComplaint: hasOthers
      ? normalizeSubjectiveText(
          data?.otherComplaint,
          SUBJECTIVE_MAX_LENGTH.otherComplaint
        )
      : "",
  };
}

/**
 * Resolves the `<SUBJECTIVE>` payload for PhilHealth XML export:
 * 1. `illnessHistory`: `sd.illnessHistory` -> stripped `subjectiveNoteContent` -> `ticketSubject` -> `""`.
 * 2. `signsSymptoms`: normalized `;`-delimited code list (or `"X"` fallback if legacy free text).
 * 3. `painSite`: forwarded ONLY when `"38"` is present in normalized `signsSymptoms`.
 * 4. `otherComplaint`: forwarded ONLY when `"X"` is present in normalized `signsSymptoms`.
 * 5. Enforces uppercase normalization and Data Dictionary character limits (`2000` / `2000` / `500`).
 */
export function resolveSoapSubjectiveForXml(
  structuredData: Record<string, unknown> | Partial<SubjectiveStructuredData> | null | undefined,
  subjectiveNoteContent?: string | null,
  ticketSubject?: string | null
): SubjectiveStructuredData {
  const sd =
    structuredData && typeof structuredData === "object" && !Array.isArray(structuredData)
      ? (structuredData as Record<string, unknown>)
      : {};

  const rawIllnessHistory =
    typeof sd.illnessHistory === "string" ? sd.illnessHistory.trim() : "";
  const strippedNote = stripMarkdownToPlainText(subjectiveNoteContent);
  const rawTicketSubject =
    typeof ticketSubject === "string" ? ticketSubject.trim() : "";

  const illnessHistory = normalizeSubjectiveText(
    rawIllnessHistory || strippedNote || rawTicketSubject || "",
    SUBJECTIVE_MAX_LENGTH.illnessHistory
  );

  const rawSigns = typeof sd.signsSymptoms === "string" ? sd.signsSymptoms.trim() : "";
  const rawPainSite = typeof sd.painSite === "string" ? sd.painSite : "";
  const rawOtherComplaint =
    typeof sd.otherComplaint === "string" ? sd.otherComplaint : "";

  let codes: string[] = [];
  let resolvedOtherComplaint = "";

  if (rawSigns) {
    if (isSignsSymptomsCodeList(rawSigns)) {
      codes = parseSignsSymptomsCodes(rawSigns);
      if (codes.includes(OTHERS_SYMPTOM_CODE)) {
        resolvedOtherComplaint = normalizeSubjectiveText(
          rawOtherComplaint,
          SUBJECTIVE_MAX_LENGTH.otherComplaint
        );
      }
    } else {
      // Legacy non-code free-text stored in signsSymptoms: route to X + otherComplaint
      codes = [OTHERS_SYMPTOM_CODE];
      resolvedOtherComplaint = normalizeSubjectiveText(
        [rawSigns, rawOtherComplaint.trim()].filter(Boolean).join(" | "),
        SUBJECTIVE_MAX_LENGTH.otherComplaint
      );
    }
  }

  const resolvedPainSite = codes.includes(PAIN_SYMPTOM_CODE)
    ? normalizeSubjectiveText(rawPainSite, SUBJECTIVE_MAX_LENGTH.painSite)
    : "";

  return {
    illnessHistory,
    signsSymptoms: codes.join(";").slice(0, SUBJECTIVE_MAX_LENGTH.signsSymptoms),
    otherComplaint: resolvedOtherComplaint,
    painSite: resolvedPainSite,
  };
}

/**
 * Normalizes `<SUBJECTIVE>` attributes right before XML element serialization,
 * ensuring uppercase text, padded/deduplicated `;`-delimited symptom codes,
 * legacy free-text `signsSymptoms` fallback, and Data Dictionary length limits.
 */
export function normalizeSubjectiveForXml(input: {
  illnessHistory?: string | null;
  signsSymptoms?: string | null;
  otherComplaint?: string | null;
  painSite?: string | null;
}): {
  pIllnessHistory: string;
  pSignsSymptoms: string;
  pOtherComplaint: string;
  pPainSite: string;
} {
  const pIllnessHistory = normalizeSubjectiveText(
    input.illnessHistory,
    SUBJECTIVE_MAX_LENGTH.illnessHistory
  );
  let pOtherComplaint = normalizeSubjectiveText(
    input.otherComplaint,
    SUBJECTIVE_MAX_LENGTH.otherComplaint
  );
  const pPainSite = normalizeSubjectiveText(
    input.painSite,
    SUBJECTIVE_MAX_LENGTH.painSite
  );

  const rawSigns = (input.signsSymptoms ?? "").trim();
  let signsArray: string[] = [];

  if (rawSigns) {
    if (!isSignsSymptomsCodeList(rawSigns)) {
      pOtherComplaint = normalizeSubjectiveText(
        [rawSigns, pOtherComplaint].filter(Boolean).join(" | "),
        SUBJECTIVE_MAX_LENGTH.otherComplaint
      );
      signsArray.push(OTHERS_SYMPTOM_CODE);
    } else {
      signsArray = parseSignsSymptomsCodes(rawSigns);
    }
  }

  if (pOtherComplaint && !signsArray.includes(OTHERS_SYMPTOM_CODE)) {
    signsArray.push(OTHERS_SYMPTOM_CODE);
  }

  if (pPainSite && !signsArray.includes(PAIN_SYMPTOM_CODE)) {
    signsArray.push(PAIN_SYMPTOM_CODE);
  }

  const pSignsSymptoms = signsArray
    .join(";")
    .slice(0, SUBJECTIVE_MAX_LENGTH.signsSymptoms);

  return {
    pIllnessHistory,
    pSignsSymptoms,
    pOtherComplaint,
    pPainSite,
  };
}
