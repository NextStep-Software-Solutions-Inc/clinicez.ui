import {
  parsePeCodes,
  formatPeCodes,
  isEssentiallyNormal,
  isOthersCode,
  togglePeFindingCode,
  OTHERS_CODE,
} from "./physical-exam-utils";

describe("physical-exam-utils", () => {
  describe("parsePeCodes", () => {
    it("should return empty array for null, undefined, or empty string", () => {
      expect(parsePeCodes(null)).toEqual([]);
      expect(parsePeCodes(undefined)).toEqual([]);
      expect(parsePeCodes("")).toEqual([]);
      expect(parsePeCodes("   ")).toEqual([]);
    });

    it("should parse single code string", () => {
      expect(parsePeCodes("11")).toEqual(["11"]);
      expect(parsePeCodes(" 11 ")).toEqual(["11"]);
    });

    it("should parse semicolon-delimited strings", () => {
      expect(parsePeCodes("16;17;99")).toEqual(["16", "17", "99"]);
      expect(parsePeCodes(" 16 ; 17 ; 99 ")).toEqual(["16", "17", "99"]);
    });

    it("should parse comma-delimited strings", () => {
      expect(parsePeCodes("6,3,7,8,4,9,99")).toEqual(["6", "3", "7", "8", "4", "9", "99"]);
    });

    it("should handle mixed delimiters and remove duplicates", () => {
      expect(parsePeCodes("1,2;2,3;1")).toEqual(["1", "2", "3"]);
    });

    it("should handle array input directly", () => {
      expect(parsePeCodes(["16", "17"])).toEqual(["16", "17"]);
      expect(parsePeCodes(["16;17", "99"])).toEqual(["16", "17", "99"]);
    });
  });

  describe("formatPeCodes", () => {
    it("should join codes with semicolons", () => {
      expect(formatPeCodes(["16", "17", "99"])).toBe("16;17;99");
      expect(formatPeCodes("16;17")).toBe("16;17");
      expect(formatPeCodes(null)).toBe("");
    });
  });

  describe("isEssentiallyNormal", () => {
    it("should identify essentially normal codes for each category", () => {
      expect(isEssentiallyNormal("HEENT", "11")).toBe(true);
      expect(isEssentiallyNormal("HEENT", "16")).toBe(false);

      expect(isEssentiallyNormal("HEART", "5")).toBe(true);
      expect(isEssentiallyNormal("HEART", "2")).toBe(true);
      expect(isEssentiallyNormal("HEART", "6")).toBe(false);

      expect(isEssentiallyNormal("SKIN", "1")).toBe(true);
      expect(isEssentiallyNormal("RECTAL", "0")).toBe(true);
      expect(isEssentiallyNormal("RECTAL", "1")).toBe(true);
      expect(isEssentiallyNormal("RECTAL", "4")).toBe(false);
    });

    it("should check description fallback", () => {
      expect(isEssentiallyNormal("CUSTOM", "xyz", "Essentially normal finding")).toBe(true);
      expect(isEssentiallyNormal("CUSTOM", "xyz", "Not applicable here")).toBe(true);
      expect(isEssentiallyNormal("CUSTOM", "xyz", "Pale conjunctivae")).toBe(false);
    });
  });

  describe("isOthersCode", () => {
    it("should identify 99 as others", () => {
      expect(isOthersCode("99")).toBe(true);
      expect(isOthersCode(OTHERS_CODE)).toBe(true);
      expect(isOthersCode("1")).toBe(false);
    });
  });

  describe("togglePeFindingCode", () => {
    it("should toggle off an existing code", () => {
      const initial = ["16", "17"];
      expect(togglePeFindingCode("HEENT", initial, "16")).toEqual(["17"]);
    });

    it("should add a new abnormal code alongside existing abnormal codes", () => {
      const initial = ["16"];
      expect(togglePeFindingCode("HEENT", initial, "17")).toEqual(["16", "17"]);
      expect(togglePeFindingCode("HEENT", ["16", "17"], "99")).toEqual(["16", "17", "99"]);
    });

    it("should clear all other codes when essentially normal is selected", () => {
      const initial = ["16", "17", "99"];
      // 11 is Essentially Normal for HEENT
      expect(togglePeFindingCode("HEENT", initial, "11")).toEqual(["11"]);
    });

    it("should clear essentially normal when an abnormal code is selected", () => {
      const initial = ["11"]; // Essentially Normal
      expect(togglePeFindingCode("HEENT", initial, "16")).toEqual(["16"]);
    });

    it("should handle description-based essentially normal correctly", () => {
      const initial = ["opt1", "opt2"];
      expect(togglePeFindingCode("UNKNOWN", initial, "norm", "Essentially normal")).toEqual(["norm"]);
    });
  });
});
