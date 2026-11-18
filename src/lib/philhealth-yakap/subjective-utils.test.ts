import { PHILHEALTH_SIGNS_AND_SYMPTOMS } from "./signs-and-symptoms-library";
import {
  formatSubjectiveInput,
  isSignsSymptomsCodeList,
  normalizeSubjectiveForXml,
  normalizeSubjectiveText,
  parseSignsSymptomsCodes,
  resolveSoapSubjectiveForXml,
  sanitizeStructuredDataForStorage,
  stripMarkdownToPlainText,
  SUBJECTIVE_MAX_LENGTH,
} from "./subjective-utils";

describe("signs-and-symptoms-library (lib_signs_symptoms.xlsx)", () => {
  it("contains all 39 official PhilHealth entries (36 active, 3 inactive: 16, 24, 31)", () => {
    expect(PHILHEALTH_SIGNS_AND_SYMPTOMS).toHaveLength(39);

    const active = PHILHEALTH_SIGNS_AND_SYMPTOMS.filter((s) => s.isActive);
    const inactive = PHILHEALTH_SIGNS_AND_SYMPTOMS.filter((s) => !s.isActive);

    expect(active).toHaveLength(36);
    expect(inactive.map((s) => s.code)).toEqual(["16", "24", "31"]);

    const codes = PHILHEALTH_SIGNS_AND_SYMPTOMS.map((s) => s.code);
    expect(new Set(codes).size).toBe(39);
    expect(codes).toContain("01");
    expect(codes).toContain("38");
    expect(codes).toContain("X");
  });
});

describe("subjective-utils", () => {
  describe("stripMarkdownToPlainText", () => {
    it("strips headings, bold, italic, links, blockquotes, lists, and code fences", () => {
      const md = [
        "### History of Present Illness",
        "> Patient reports **persistent fever** and _dry cough_ for `3 days`.",
        "- Took [Paracetamol](https://example.com) 500mg",
        "1. Associated with *myalgia* and ~~chills~~",
      ].join("\n");

      expect(stripMarkdownToPlainText(md)).toBe(
        [
          "History of Present Illness",
          "Patient reports persistent fever and dry cough for 3 days.",
          "Took Paracetamol 500mg",
          "Associated with myalgia and chills",
        ].join("\n")
      );
    });

    it("preserves clinical arithmetic and underscore identifiers without over-stripping", () => {
      expect(stripMarkdownToPlainText("Dose 2 * 3 * 4 mg; code patient_id_1")).toBe(
        "Dose 2 * 3 * 4 mg; code patient_id_1"
      );
    });

    it("returns empty string for null, undefined, or whitespace", () => {
      expect(stripMarkdownToPlainText(null)).toBe("");
      expect(stripMarkdownToPlainText(undefined)).toBe("");
      expect(stripMarkdownToPlainText("   \n  ")).toBe("");
    });
  });

  describe("parseSignsSymptomsCodes & isSignsSymptomsCodeList", () => {
    it("splits delimiters, trims, uppercases x->X, pads single digits, and deduplicates preserving order", () => {
      expect(parseSignsSymptomsCodes(" 1 ; 38 , x ; 01 ; 37 ; X ; 9 ")).toEqual([
        "01",
        "38",
        "X",
        "37",
        "09",
      ]);
    });

    it("handles empty or delimiter-only values cleanly", () => {
      expect(parseSignsSymptomsCodes("")).toEqual([]);
      expect(parseSignsSymptomsCodes(null)).toEqual([]);
      expect(parseSignsSymptomsCodes(" ; , ; ")).toEqual([]);
      expect(isSignsSymptomsCodeList("01;38;x")).toBe(true);
      expect(isSignsSymptomsCodeList("Fever and cough")).toBe(false);
      expect(parseSignsSymptomsCodes("Fever and cough")).toEqual([]);
    });
  });

  describe("formatSubjectiveInput & normalizeSubjectiveText", () => {
    it("formatSubjectiveInput preserves trailing spaces during live typing while uppercasing and capping", () => {
      expect(formatSubjectiveInput("fever and ", 2000)).toBe("FEVER AND ");
      expect(formatSubjectiveInput("a".repeat(600), 500)).toHaveLength(500);
    });

    it("normalizeSubjectiveText trims, uppercases, and truncates to max length", () => {
      expect(normalizeSubjectiveText("  Headache x 3 days  ", 2000)).toBe(
        "HEADACHE X 3 DAYS"
      );
      expect(normalizeSubjectiveText("x".repeat(2500), 2000)).toHaveLength(2000);
      expect(normalizeSubjectiveText("   ", 500)).toBe("");
    });
  });

  describe("sanitizeStructuredDataForStorage", () => {
    it("clears stale painSite and otherComplaint when 38 and X are unselected", () => {
      const sanitized = sanitizeStructuredDataForStorage({
        illnessHistory: "  Fever for 2 days  ",
        signsSymptoms: "37;09",
        painSite: "Abdomen",
        otherComplaint: "Stale complaint",
      });

      expect(sanitized).toEqual({
        illnessHistory: "FEVER FOR 2 DAYS",
        signsSymptoms: "37;09",
        painSite: "",
        otherComplaint: "",
      });
    });

    it("keeps and normalizes painSite and otherComplaint when 38 and X are selected", () => {
      const sanitized = sanitizeStructuredDataForStorage({
        illnessHistory: "a".repeat(2100),
        signsSymptoms: "37;38;x",
        painSite: "b".repeat(550),
        otherComplaint: "c".repeat(2100),
      });

      expect(sanitized.signsSymptoms).toBe("37;38;X");
      expect(sanitized.illnessHistory).toHaveLength(SUBJECTIVE_MAX_LENGTH.illnessHistory);
      expect(sanitized.painSite).toHaveLength(SUBJECTIVE_MAX_LENGTH.painSite);
      expect(sanitized.otherComplaint).toHaveLength(SUBJECTIVE_MAX_LENGTH.otherComplaint);
    });
  });

  describe("resolveSoapSubjectiveForXml", () => {
    it("prioritizes sd.illnessHistory -> stripped subjectiveNoteContent -> ticketSubject", () => {
      expect(
        resolveSoapSubjectiveForXml(
          { illnessHistory: "Primary HPI", signsSymptoms: "37" },
          "Markdown HPI",
          "Ticket Subject"
        ).illnessHistory
      ).toBe("PRIMARY HPI");

      expect(
        resolveSoapSubjectiveForXml(
          { illnessHistory: "   ", signsSymptoms: "37" },
          "### HPI\n**Fever** for 3 days",
          "Ticket Subject"
        ).illnessHistory
      ).toBe("HPI\nFEVER FOR 3 DAYS");

      expect(
        resolveSoapSubjectiveForXml(null, "", "Consultation 101").illnessHistory
      ).toBe("CONSULTATION 101");
    });

    it("gates painSite on '38' and otherComplaint on 'X' even if stale DB fields exist", () => {
      const resolved = resolveSoapSubjectiveForXml(
        {
          illnessHistory: "Cough",
          signsSymptoms: "09;37",
          painSite: "Chest",
          otherComplaint: "Runny nose",
        },
        "",
        ""
      );

      expect(resolved).toEqual({
        illnessHistory: "COUGH",
        signsSymptoms: "09;37",
        painSite: "",
        otherComplaint: "",
      });
    });

    it("routes legacy free-text signsSymptoms to X + otherComplaint", () => {
      const resolved = resolveSoapSubjectiveForXml(
        {
          illnessHistory: "HPI",
          signsSymptoms: "Persistent dizziness",
          painSite: "Head",
          otherComplaint: "Mild nausea",
        },
        "",
        ""
      );

      expect(resolved).toEqual({
        illnessHistory: "HPI",
        signsSymptoms: "X",
        otherComplaint: "PERSISTENT DIZZINESS | MILD NAUSEA",
        painSite: "",
      });
    });
  });

  describe("normalizeSubjectiveForXml", () => {
    it("normalizes codes, casing, and Data Dictionary bounds", () => {
      const result = normalizeSubjectiveForXml({
        illnessHistory: "d".repeat(2050),
        signsSymptoms: "1;38;x;1",
        painSite: "e".repeat(520),
        otherComplaint: "f".repeat(2050),
      });

      expect(result.pIllnessHistory).toHaveLength(2000);
      expect(result.pIllnessHistory).toBe("D".repeat(2000));
      expect(result.pSignsSymptoms).toBe("01;38;X");
      expect(result.pPainSite).toHaveLength(500);
      expect(result.pPainSite).toBe("E".repeat(500));
      expect(result.pOtherComplaint).toHaveLength(2000);
      expect(result.pOtherComplaint).toBe("F".repeat(2000));
    });
  });
});
