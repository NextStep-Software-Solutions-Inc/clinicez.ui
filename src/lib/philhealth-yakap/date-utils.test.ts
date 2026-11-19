import { extractAgeFromXml, formatPhilHealthAge } from "./date-utils";

/**
 * Reference age formula copied from src/actions/philhealth-yakap.actions.ts:770-780
 * to assert exact mathematical parity across month/day borrowing edge cases.
 */
function referencePhilHealthActionAge(dobInput: Date | string, now: Date): string {
  const dob = new Date(dobInput);
  const ageYears = now.getFullYear() - dob.getFullYear();
  const ageMonths = now.getMonth() - dob.getMonth();
  const ageDays = now.getDate() - dob.getDate();
  const adjustedMonths = ageDays < 0 ? ageMonths - 1 : ageMonths;
  const adjustedYears = adjustedMonths < 0 ? ageYears - 1 : ageYears;
  const finalMonths = adjustedMonths < 0 ? adjustedMonths + 12 : adjustedMonths;
  const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const finalDays = ageDays < 0 ? prevMonthDays + ageDays : ageDays;
  return `${adjustedYears} YR(S), ${finalMonths} MO(S), ${finalDays} DAY(S)`;
}

describe("date-utils (Issue #518)", () => {
  describe("formatPhilHealthAge", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it.each([
      {
        label: "non-leap year February borrowing (28 days)",
        now: "2025-03-10T12:00:00Z",
        dob: "1990-02-20",
        expected: "35 YR(S), 0 MO(S), 18 DAY(S)",
      },
      {
        label: "leap year February borrowing (29 days)",
        now: "2024-03-10T12:00:00Z",
        dob: "1990-02-20",
        expected: "34 YR(S), 0 MO(S), 19 DAY(S)",
      },
      {
        label: "30-day previous month borrowing (April -> May)",
        now: "2026-05-05T12:00:00Z",
        dob: "1990-04-20",
        expected: "36 YR(S), 0 MO(S), 15 DAY(S)",
      },
      {
        label: "31-day previous month borrowing (March -> April)",
        now: "2026-04-05T12:00:00Z",
        dob: "1990-03-20",
        expected: "36 YR(S), 0 MO(S), 16 DAY(S)",
      },
      {
        label: "month borrowing (m < 0 decrements year and adds 12)",
        now: "2026-02-15T12:00:00Z",
        dob: "1990-08-10",
        expected: "35 YR(S), 6 MO(S), 5 DAY(S)",
      },
      {
        label: "combined day and month borrowing across year boundary (Dec 31 -> Jan)",
        now: "2026-01-05T12:00:00Z",
        dob: "1990-01-20",
        expected: "35 YR(S), 11 MO(S), 16 DAY(S)",
      },
      {
        label: "newborn same-day DOB",
        now: "2026-11-17T12:00:00Z",
        dob: "2026-11-17",
        expected: "0 YR(S), 0 MO(S), 0 DAY(S)",
      },
    ])("formats $label with exact parity to philhealth-yakap.actions.ts", ({ now, dob, expected }) => {
      jest.useFakeTimers();
      const nowDate = new Date(now);
      jest.setSystemTime(nowDate);

      expect(formatPhilHealthAge(dob)).toBe(expected);
      expect(formatPhilHealthAge(new Date(dob))).toBe(expected);
      expect(formatPhilHealthAge(dob)).toBe(referencePhilHealthActionAge(dob, nowDate));
    });

    it("returns null for future DOBs (y < 0)", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-11-17T12:00:00Z"));

      expect(formatPhilHealthAge("2027-01-01")).toBeNull();
      expect(formatPhilHealthAge("2026-12-01")).toBeNull();
      expect(formatPhilHealthAge(new Date("2026-11-18T00:00:00Z"))).toBeNull();
    });

    it("returns null for null, undefined, empty, or invalid DOB strings", () => {
      expect(formatPhilHealthAge(null)).toBeNull();
      expect(formatPhilHealthAge(undefined)).toBeNull();
      expect(formatPhilHealthAge("")).toBeNull();
      expect(formatPhilHealthAge("not-a-valid-date")).toBeNull();
    });
  });

  describe("extractAgeFromXml", () => {
    const sampleXml = `
      <PCB>
        <PROFILING>
          <PROFILE pHciTransNo="PP1001" pHciCaseNo="TP1001" pPatientPin="123456789012" pPatientAge="42 YR(S), 11 MO(S), 29 DAY(S)" pMemPin="123456789012" />
          <PROFILE pPatientAge="10 YR(S), 2 MO(S), 3 DAY(S)" pHciCaseNo="TP2002" pPatientPin="999888777666" />
        </PROFILING>
        <SOAPS>
          <SOAP pHciCaseNo="TP3003" pHciTransNo="SP3003" pPatientPin="555444333222" pPatientAge="65 YR(S), 1 MO(S), 0 DAY(S)" />
          <SOAP pHciCaseNo="TP4004" pHciTransNo="SP4004" pPatientPin="111222333444" pPatientAge="   " />
        </SOAPS>
      </PCB>
    `;

    it("extracts pPatientAge from <PROFILE> by patientPin regardless of attribute order", () => {
      expect(extractAgeFromXml(sampleXml, { patientPin: "123456789012" })).toBe(
        "42 YR(S), 11 MO(S), 29 DAY(S)"
      );
      expect(extractAgeFromXml(sampleXml, { patientPin: "999888777666" })).toBe(
        "10 YR(S), 2 MO(S), 3 DAY(S)"
      );
    });

    it("extracts pPatientAge from <PROFILE> by caseNo when patientPin is omitted or unmatched", () => {
      expect(extractAgeFromXml(sampleXml, { caseNo: " TP2002 " })).toBe(
        "10 YR(S), 2 MO(S), 3 DAY(S)"
      );
    });

    it("falls back to <SOAP> by caseNo or patientPin when no <PROFILE> matches", () => {
      expect(extractAgeFromXml(sampleXml, { caseNo: "TP3003" })).toBe(
        "65 YR(S), 1 MO(S), 0 DAY(S)"
      );
      expect(extractAgeFromXml(sampleXml, { patientPin: "555444333222" })).toBe(
        "65 YR(S), 1 MO(S), 0 DAY(S)"
      );
    });

    it("escapes RegExp metacharacters in patientPin and caseNo without throwing or false-matching", () => {
      const xmlWithSpecialChars = `
        <PCB>
          <PROFILE pPatientPin="12X34560a" pHciCaseNo="CASEX1" pPatientAge="99 YR(S), 0 MO(S), 0 DAY(S)" />
          <PROFILE pPatientPin="12.34+56[0](a)" pHciCaseNo="CASE.1+2[3](x)" pPatientAge="27 YR(S), 6 MO(S), 12 DAY(S)" />
        </PCB>
      `;

      // Must not match "12X34560a" when "." or "+" regex metacharacters are present
      expect(extractAgeFromXml(xmlWithSpecialChars, { patientPin: "12.34+56[0](a)" })).toBe(
        "27 YR(S), 6 MO(S), 12 DAY(S)"
      );
      expect(extractAgeFromXml(xmlWithSpecialChars, { caseNo: "CASE.1+2[3](x)" })).toBe(
        "27 YR(S), 6 MO(S), 12 DAY(S)"
      );
      expect(extractAgeFromXml(xmlWithSpecialChars, { patientPin: "12.34" })).toBeNull();
      expect(extractAgeFromXml(xmlWithSpecialChars, { caseNo: "CASE.*(unclosed" })).toBeNull();
    });

    it("returns null for empty/missing XML, empty identifiers, or blank pPatientAge", () => {
      expect(extractAgeFromXml("", { patientPin: "123456789012" })).toBeNull();
      expect(extractAgeFromXml(sampleXml, {})).toBeNull();
      expect(extractAgeFromXml(sampleXml, { patientPin: "   ", caseNo: "   " })).toBeNull();
      expect(extractAgeFromXml(sampleXml, { caseNo: "TP4004" })).toBeNull();
    });
  });
});
