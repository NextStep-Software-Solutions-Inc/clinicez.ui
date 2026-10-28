import { STAGING_TEST_MEMBERS } from "@/services/konsulta/pcb-xml-builder";

/**
 * Normalizes date strings from PhilHealth (ISO YYYY-MM-DD, Oracle DD-MON-YY, MM/DD/YYYY)
 * to standard ISO YYYY-MM-DD.
 */
export function parsePhilHealthDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const s = dateStr.trim();
  if (!s) return null;

  // 1. ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  // 2. Oracle format: DD-MON-YY or DD-MON-YYYY (e.g. 08-APR-26 or 08-APR-2026)
  const oracleMatch = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2}|\d{4})$/);
  if (oracleMatch) {
    const [, day, monStr, yrStr] = oracleMatch;
    const MON: Record<string, string> = {
      JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
      JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
    };
    const mon = MON[monStr.toUpperCase()];
    if (mon) {
      const yr = yrStr.length === 2 ? (parseInt(yrStr, 10) < 50 ? `20${yrStr}` : `19${yrStr}`) : yrStr;
      return `${yr}-${mon}-${day.padStart(2, "0")}`;
    }
  }

  // 3. MM/DD/YYYY format
  const slashParts = s.split("/");
  if (slashParts.length === 3 && slashParts[2].length === 4) {
    const [m, d, y] = slashParts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // 4. Fallback to native Date
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Resolves the authoritative PhilHealth Masterlist Assignment / Enlistment Date.
 * If the patient was imported from the PhilHealth server, that assignment date must take
 * precedence over any subsequent internal staff enlistment date.
 */
export function resolvePhilHealthEnlistDate(
  clinicPatient: {
    konsultaRegistrationResult?: unknown;
    konsultaRegisteredAt?: Date | null;
    enlistmentDate?: Date | string | null;
    PhilHealthKonsultaEnlistments?: Array<{ enlistmentDate?: Date | null }>;
  } | null | undefined,
  pins: { patientPin?: string | null; memberPin?: string | null },
  fallbackDate: string
): string {
  // 0. Check explicit enlistmentDate if stored
  if (clinicPatient?.enlistmentDate) {
    const parsed = parsePhilHealthDate(clinicPatient.enlistmentDate instanceof Date ? clinicPatient.enlistmentDate.toISOString() : String(clinicPatient.enlistmentDate));
    if (parsed) return parsed;
  }
  if (clinicPatient?.PhilHealthKonsultaEnlistments?.[0]?.enlistmentDate) {
    const parsed = parsePhilHealthDate(clinicPatient.PhilHealthKonsultaEnlistments[0].enlistmentDate.toISOString());
    if (parsed) return parsed;
  }

  // 1. Check konsultaRegistrationResult for pAssignedDate / assignedDate
  const regResult = clinicPatient?.konsultaRegistrationResult as Record<string, any> | null;
  if (regResult) {
    const rawAssigned = regResult.pAssignedDate || regResult.assignedDate || regResult.raw?.pAssignedDate;
    const parsed = parsePhilHealthDate(rawAssigned);
    if (parsed) return parsed;
  }

  // 2. Check konsultaRegisteredAt
  if (clinicPatient?.konsultaRegisteredAt) {
    const d = new Date(clinicPatient.konsultaRegisteredAt);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }

  // 3. Check official PhilHealth staging test members for known assignments
  const pPin = pins.patientPin?.trim();
  const mPin = pins.memberPin?.trim();
  const stagingMatch = STAGING_TEST_MEMBERS.find(
    (m) =>
      (pPin && m.pAssignedPin === pPin) ||
      (mPin && (m.pAssignedPin === mPin || m.pPrimaryPIN === mPin))
  );
  if (stagingMatch?.pAssignedDate) {
    const parsed = parsePhilHealthDate(stagingMatch.pAssignedDate);
    if (parsed) return parsed;
  }

  // 4. Default to fallbackDate
  return fallbackDate;
}

/**
 * Dynamically extract the transaction number associated with a patient/ticket
 * from a PhilHealth Konsulta / Yakap XML payload.
 */
export function extractTransactionNoFromXml(
  xml: string,
  options?: {
    patientPin?: string | null;
    caseNo?: string | null;
    ticketId?: number | null;
  }
): string | null {
  if (!xml || typeof xml !== "string") return null;

  const { patientPin, caseNo } = options || {};

  // 1. Check <PROFILE ...> by patientPin
  if (patientPin) {
    const profileRegex = new RegExp(`<PROFILE\\b[^>]*?pPatientPin=["']${patientPin}["'][^>]*?>`, "i");
    const profileMatch = xml.match(profileRegex);
    if (profileMatch) {
      const transMatch = profileMatch[0].match(/pHciTransNo=["']([^"']+)["']/i);
      if (transMatch && transMatch[1]) return transMatch[1];
    }
  }

  // 2. Check <PROFILE ...> or <SOAP ...> by caseNo
  if (caseNo) {
    const caseClean = caseNo.trim();
    const profileRegex = new RegExp(`<PROFILE\\b[^>]*?pHciCaseNo=["']${caseClean}["'][^>]*?>`, "i");
    const profileMatch = xml.match(profileRegex);
    if (profileMatch) {
      const transMatch = profileMatch[0].match(/pHciTransNo=["']([^"']+)["']/i);
      if (transMatch && transMatch[1]) return transMatch[1];
    }

    const soapRegex = new RegExp(`<SOAP\\b[^>]*?pHciCaseNo=["']${caseClean}["'][^>]*?>`, "i");
    const soapMatch = xml.match(soapRegex);
    if (soapMatch) {
      const transMatch = soapMatch[0].match(/pHciTransNo=["']([^"']+)["']/i);
      if (transMatch && transMatch[1]) return transMatch[1];
    }
  }

  // 3. Check <SOAP ...> by patientPin
  if (patientPin) {
    const soapRegex = new RegExp(`<SOAP\\b[^>]*?pPatientPin=["']${patientPin}["'][^>]*?>`, "i");
    const soapMatch = xml.match(soapRegex);
    if (soapMatch) {
      const transMatch = soapMatch[0].match(/pHciTransNo=["']([^"']+)["']/i);
      if (transMatch && transMatch[1]) return transMatch[1];
    }
  }

  // 4. Check <ENLISTMENT ...> by caseNo if needed
  if (caseNo) {
    const enlistRegex = new RegExp(`<ENLISTMENT\\b[^>]*?pHciCaseNo=["']${caseNo.trim()}["'][^>]*?>`, "i");
    const enlistMatch = xml.match(enlistRegex);
    if (enlistMatch) {
      const transMatch = enlistMatch[0].match(/pHciTransNo=["']([^"']+)["']/i);
      if (transMatch && transMatch[1]) return transMatch[1];
    }
  }

  return null;
}

/**
 * Dynamically extract the patient age string associated with a patient/ticket
 * from a PhilHealth Konsulta / Yakap XML payload.
 *
 * Example XML value: pPatientAge="27 YR(S), 6 MO(S), 12 DAY(S)"
 */
export function extractAgeFromXml(
  xml: string,
  options?: {
    patientPin?: string | null;
    caseNo?: string | null;
    ticketId?: number | null;
  }
): string | null {
  if (!xml || typeof xml !== "string") return null;

  const { patientPin, caseNo } = options || {};

  // 1. Check <PROFILE ...> by patientPin
  if (patientPin) {
    const profileRegex = new RegExp(`<PROFILE\\b[^>]*?pPatientPin=["']${patientPin}["'][^>]*?>`, "i");
    const profileMatch = xml.match(profileRegex);
    if (profileMatch) {
      const ageMatch = profileMatch[0].match(/pPatientAge=["']([^"']+)["']/i);
      if (ageMatch && ageMatch[1]?.trim()) return ageMatch[1].trim();
    }
  }

  // 2. Check <PROFILE ...> or <SOAP ...> by caseNo
  if (caseNo) {
    const caseClean = caseNo.trim();
    const profileRegex = new RegExp(`<PROFILE\\b[^>]*?pHciCaseNo=["']${caseClean}["'][^>]*?>`, "i");
    const profileMatch = xml.match(profileRegex);
    if (profileMatch) {
      const ageMatch = profileMatch[0].match(/pPatientAge=["']([^"']+)["']/i);
      if (ageMatch && ageMatch[1]?.trim()) return ageMatch[1].trim();
    }

    const soapRegex = new RegExp(`<SOAP\\b[^>]*?pHciCaseNo=["']${caseClean}["'][^>]*?>`, "i");
    const soapMatch = xml.match(soapRegex);
    if (soapMatch) {
      const ageMatch = soapMatch[0].match(/pPatientAge=["']([^"']+)["']/i);
      if (ageMatch && ageMatch[1]?.trim()) return ageMatch[1].trim();
    }
  }

  // 3. Check <SOAP ...> by patientPin
  if (patientPin) {
    const soapRegex = new RegExp(`<SOAP\\b[^>]*?pPatientPin=["']${patientPin}["'][^>]*?>`, "i");
    const soapMatch = xml.match(soapRegex);
    if (soapMatch) {
      const ageMatch = soapMatch[0].match(/pPatientAge=["']([^"']+)["']/i);
      if (ageMatch && ageMatch[1]?.trim()) return ageMatch[1].trim();
    }
  }

  return null;
}

/**
 * Format date of birth into the standard PhilHealth age format:
 * "<years> YR(S), <months> MO(S), <days> DAY(S)"
 */
export function formatPhilHealthAge(dob: Date | string | null | undefined): string | null {
  if (!dob) return null;
  const d = typeof dob === "string" ? new Date(dob) : dob;
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  let m = now.getMonth() - d.getMonth();
  let days = now.getDate() - d.getDate();
  if (days < 0) {
    m--;
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (m < 0) {
    y--;
    m += 12;
  }
  return `${y} YR(S), ${m} MO(S), ${days} DAY(S)`;
}
