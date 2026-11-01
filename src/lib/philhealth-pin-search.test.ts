import {
  extractPhilHealthPinSearchTerms,
  buildUserPhilHealthPinOrFilters,
  formatPhilHealthPinDisplay,
  resolvePatientPhilHealthPin,
  matchesPhilHealthPinClient,
} from "./philhealth-pin-search";

describe("philhealth-pin-search", () => {
  describe("extractPhilHealthPinSearchTerms", () => {
    it("extracts raw digits and formatted PIN from a 12-digit unformatted PIN", () => {
      const terms = extractPhilHealthPinSearchTerms("190270939817");
      expect(terms).toContain("190270939817");
      expect(terms).toContain("19-027093981-7");
    });

    it("extracts raw digits and dashed PIN from a hyphenated PhilHealth PIN", () => {
      const terms = extractPhilHealthPinSearchTerms("19-027093981-7");
      expect(terms).toContain("190270939817");
      expect(terms).toContain("19-027093981-7");
    });

    it("handles partial dashed or space-separated PIN queries", () => {
      expect(extractPhilHealthPinSearchTerms("19-0270")).toEqual(
        expect.arrayContaining(["190270", "19-0270"])
      );
      expect(extractPhilHealthPinSearchTerms("027093981-7")).toEqual(
        expect.arrayContaining(["0270939817", "027093981-7"])
      );
      expect(extractPhilHealthPinSearchTerms("19 027093981 7")).toEqual(
        expect.arrayContaining(["190270939817", "19-027093981-7"])
      );
    });

    it("handles PIN/PHIC/PhilHealth prefixes", () => {
      expect(extractPhilHealthPinSearchTerms("PIN: 19-027093981-7")).toContain("190270939817");
      expect(extractPhilHealthPinSearchTerms("PHIC 012523472206")).toContain("012523472206");
      expect(extractPhilHealthPinSearchTerms("PhilHealth PIN: 190270939817")).toContain("190270939817");
    });

    it("returns empty array for names, emails, alphanumeric IDs, or <2 digits", () => {
      expect(extractPhilHealthPinSearchTerms("")).toEqual([]);
      expect(extractPhilHealthPinSearchTerms("   ")).toEqual([]);
      expect(extractPhilHealthPinSearchTerms("1")).toEqual([]);
      expect(extractPhilHealthPinSearchTerms("---")).toEqual([]);
      expect(extractPhilHealthPinSearchTerms("Juan 2")).toEqual([]);
      expect(extractPhilHealthPinSearchTerms("john12@gmail.com")).toEqual([]);
      expect(extractPhilHealthPinSearchTerms("STU-2024-001")).toEqual([]);
    });
  });

  describe("buildUserPhilHealthPinOrFilters", () => {
    it("returns empty array for non-PIN search queries", () => {
      expect(buildUserPhilHealthPinOrFilters("Maria Santos")).toEqual([]);
    });

    it("builds PhilHealthRecords and ClinicPatients filters scoped by clinicUid", () => {
      const filters = buildUserPhilHealthPinOrFilters("19-027093981-7", {
        clinicUid: "clinic-abc",
      });
      expect(filters).toHaveLength(2);
      expect(filters[0]).toHaveProperty("PhilHealthRecords.some.isActive", true);
      expect(filters[1]).toHaveProperty("ClinicPatients.some.Clinic.clinicUid", "clinic-abc");
    });
  });

  describe("formatPhilHealthPinDisplay", () => {
    it("formats 12-digit PINs as XX-XXXXXXXXX-X", () => {
      expect(formatPhilHealthPinDisplay("190270939817")).toBe("19-027093981-7");
      expect(formatPhilHealthPinDisplay("19-027093981-7")).toBe("19-027093981-7");
    });

    it("returns empty string for null/undefined/blank and preserves non-12-digit strings", () => {
      expect(formatPhilHealthPinDisplay(null)).toBe("");
      expect(formatPhilHealthPinDisplay("   ")).toBe("");
      expect(formatPhilHealthPinDisplay("TEMP-123")).toBe("TEMP-123");
    });
  });

  describe("resolvePatientPhilHealthPin", () => {
    it("prioritizes PhilHealthRecord pin, then konsultaPatientPin, then enlistment", () => {
      expect(
        resolvePatientPhilHealthPin({
          Patient: { PhilHealthRecords: [{ pin: "190270939817" }] },
          konsultaPatientPin: "111111111111",
        })
      ).toBe("190270939817");

      expect(
        resolvePatientPhilHealthPin({
          Patient: { PhilHealthRecords: [] },
          konsultaPatientPin: "012523472206",
        })
      ).toBe("012523472206");
    });

    it("resolves dependentPin for DD enlistments and avoids misusing principal memberPin for DD", () => {
      expect(
        resolvePatientPhilHealthPin({
          PhilHealthKonsultaEnlistments: [
            { patientType: "DD", memberPin: "190270937857", dependentPin: "012523472206" },
          ],
        })
      ).toBe("012523472206");

      expect(
        resolvePatientPhilHealthPin({
          PhilHealthKonsultaEnlistments: [
            { patientType: "DD", memberPin: "190270937857", dependentPin: null },
          ],
        })
      ).toBeNull();

      expect(
        resolvePatientPhilHealthPin({
          PhilHealthKonsultaEnlistments: [
            { patientType: "MM", memberPin: "190270937857", dependentPin: null },
          ],
        })
      ).toBe("190270937857");
    });
  });

  describe("matchesPhilHealthPinClient", () => {
    it("matches dashed query against unformatted DB PIN and vice versa", () => {
      expect(matchesPhilHealthPinClient(["190270939817"], "19-027093981-7")).toBe(true);
      expect(matchesPhilHealthPinClient(["19-027093981-7"], "190270939817")).toBe(true);
      expect(matchesPhilHealthPinClient(["190270939817"], "027093")).toBe(true);
      expect(matchesPhilHealthPinClient(["190270939817"], "Juan")).toBe(false);
    });
  });
});
