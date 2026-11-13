import {
  formatKonsultaHciNumber,
  formatTransactionNumber,
  formatAuthorizationCode,
  parseTimestampFromTransactionNumber,
} from "./format-sequence";

describe("Empirical Challenger: format-sequence Stress & Adversarial Suite", () => {
  const refDate = new Date("2026-11-12T12:00:00Z");

  describe("Adversarial Facility Codes (hciAccreNo)", () => {
    it("preserves alphanumeric Hospital code 'H91000000'", () => {
      const res = formatKonsultaHciNumber("T", "H91000000", 1, refDate);
      expect(res).toBe("TH9100000020261100001");
      expect(res).toHaveLength(21);
      expect(res.slice(1, 10)).toBe("H91000000");
    });

    it("preserves alphanumeric Primary Care code 'P10038831'", () => {
      const res = formatKonsultaHciNumber("T", "P10038831", 1, refDate);
      expect(res).toBe("TP1003883120261100001");
      expect(res).toHaveLength(21);
      expect(res.slice(1, 10)).toBe("P10038831");
    });

    it("preserves lowercase alphanumeric code 'p12345678'", () => {
      const res = formatKonsultaHciNumber("T", "p12345678", 1, refDate);
      expect(res).toBe("Tp1234567820261100001");
      expect(res).toHaveLength(21);
      expect(res.slice(1, 10)).toBe("p12345678");
    });

    it("strips hyphens and maintains alphanumeric code 'H-91-000000'", () => {
      const res = formatKonsultaHciNumber("T", "H-91-000000", 1, refDate);
      expect(res).toBe("TH9100000020261100001");
      expect(res).toHaveLength(21);
      expect(res.slice(1, 10)).toBe("H91000000");
    });

    it("handles complex messy punctuation and whitespace ' #P-1003_8831! '", () => {
      const res = formatKonsultaHciNumber("S", " #P-1003_8831! ", 42, refDate);
      expect(res).toBe("SP1003883120261100042");
      expect(res).toHaveLength(21);
    });

    it("pads short alphanumeric codes with leading zeros to 9 characters", () => {
      expect(formatKonsultaHciNumber("T", "P1", 1, refDate).slice(1, 10)).toBe("0000000P1");
      expect(formatKonsultaHciNumber("T", "H99", 5, refDate).slice(1, 10)).toBe("000000H99");
      expect(formatKonsultaHciNumber("T", "12345678", 1, refDate).slice(1, 10)).toBe("012345678");
    });

    it("handles empty string, whitespace-only, and symbol-only codes", () => {
      expect(formatKonsultaHciNumber("T", "", 1, refDate).slice(1, 10)).toBe("000000000");
      expect(formatKonsultaHciNumber("T", "     ", 1, refDate).slice(1, 10)).toBe("000000000");
      expect(formatKonsultaHciNumber("T", "!@#$%^&*()_+=-~`{}[]|;:,.<>?", 1, refDate).slice(1, 10)).toBe("000000000");
    });

    it("handles undefined and null gracefully when passed via runtime casting", () => {
      // @ts-expect-error testing adversarial JS runtime input
      const resUndefined = formatKonsultaHciNumber("T", undefined, 1, refDate);
      expect(resUndefined).toBe("T00000000020261100001");
      expect(resUndefined).toHaveLength(21);

      // @ts-expect-error testing adversarial JS runtime input
      const resNull = formatKonsultaHciNumber("T", null, 1, refDate);
      expect(resNull).toBe("T00000000020261100001");
      expect(resNull).toHaveLength(21);
    });

    it("slices last 9 alphanumeric characters when input exceeds 9 characters", () => {
      const res = formatKonsultaHciNumber("T", "CLINIC-H91000000", 1, refDate);
      expect(res).toBe("TH9100000020261100001");
      expect(res).toHaveLength(21);

      const res2 = formatKonsultaHciNumber("T", "123456789012345", 1, refDate);
      expect(res2.slice(1, 10)).toBe("789012345");
      expect(res2).toHaveLength(21);
    });
  });

  describe("Adversarial Sequence Number Boundaries", () => {
    it("handles 0, 1, 99999 boundary values", () => {
      const res0 = formatKonsultaHciNumber("T", "P10038831", 0, refDate);
      expect(res0.slice(16)).toBe("00000");
      expect(res0).toHaveLength(21);

      const res1 = formatKonsultaHciNumber("T", "P10038831", 1, refDate);
      expect(res1.slice(16)).toBe("00001");
      expect(res1).toHaveLength(21);

      const resMax = formatKonsultaHciNumber("T", "P10038831", 99999, refDate);
      expect(resMax.slice(16)).toBe("99999");
      expect(resMax).toHaveLength(21);
    });

    it("handles overflow sequence numbers (100000, 100001, large sequences)", () => {
      const res100k = formatKonsultaHciNumber("T", "P10038831", 100000, refDate);
      expect(res100k.slice(16)).toBe("00000");
      expect(res100k).toHaveLength(21);

      const res100k1 = formatKonsultaHciNumber("T", "P10038831", 100001, refDate);
      expect(res100k1.slice(16)).toBe("00001");
      expect(res100k1).toHaveLength(21);

      const resLarge = formatKonsultaHciNumber("T", "P10038831", 987654321, refDate);
      expect(resLarge.slice(16)).toBe("54321");
      expect(resLarge).toHaveLength(21);
    });

    it("always enforces 5-character sequence partition length", () => {
      const sequences = [0, 1, 9, 10, 99, 100, 999, 1000, 9999, 10000, 99999, 100000, 999999];
      for (const seq of sequences) {
        const formatted = formatKonsultaHciNumber("T", "P10038831", seq, refDate);
        expect(formatted).toHaveLength(21);
        expect(formatted.slice(16)).toHaveLength(5);
      }
    });
  });

  describe("Date Boundaries & Transitions", () => {
    it("handles leap year date (Feb 29, 2024)", () => {
      const leapDate = new Date("2024-02-29T12:00:00Z");
      const res = formatKonsultaHciNumber("T", "P10038831", 1, leapDate);
      expect(res.slice(10, 16)).toBe("202402");
      expect(res).toHaveLength(21);
    });

    it("handles end-of-year boundary (Dec 31, 2026 local time)", () => {
      const endOfYear = new Date(2026, 11, 31, 23, 59, 59, 999);
      const res = formatKonsultaHciNumber("T", "P10038831", 1, endOfYear);
      expect(res.slice(10, 16)).toBe("202612");
      expect(res).toHaveLength(21);
    });

    it("handles start-of-year boundary (Jan 01, 2027 local time)", () => {
      const startOfYear = new Date(2027, 0, 1, 0, 0, 0, 0);
      const res = formatKonsultaHciNumber("T", "P10038831", 1, startOfYear);
      expect(res.slice(10, 16)).toBe("202701");
      expect(res).toHaveLength(21);
    });

    it("handles historical date (Jan 01, 1970)", () => {
      const epoch = new Date("1970-01-01T00:00:00.000Z");
      const res = formatKonsultaHciNumber("T", "P10038831", 1, epoch);
      expect(res.slice(10, 16)).toBe("197001");
      expect(res).toHaveLength(21);
    });

    it("handles far future date (Dec 15, 2099)", () => {
      const future = new Date("2099-12-15T00:00:00.000Z");
      const res = formatKonsultaHciNumber("T", "P10038831", 1, future);
      expect(res.slice(10, 16)).toBe("209912");
      expect(res).toHaveLength(21);
    });

    it("defaults to current date when date parameter is omitted", () => {
      const before = new Date();
      const res = formatKonsultaHciNumber("T", "P10038831", 1);
      const after = new Date();
      expect(res).toHaveLength(21);
      const year = res.slice(10, 14);
      expect([String(before.getFullYear()), String(after.getFullYear())]).toContain(year);
    });
  });

  describe("Prefixes & Invariants Contract Verification", () => {
    const allPrefixes: Array<"R" | "T" | "E" | "P" | "S" | "M" | "D"> = ["R", "T", "E", "P", "S", "M", "D"];

    it.each(allPrefixes)("verifies prefix '%s' produces strictly valid 21-character reference format", (p) => {
      const res = formatKonsultaHciNumber(p, "P10038831", 77, refDate);
      expect(res).toHaveLength(21);
      expect(res.charAt(0)).toBe(p);
      expect(res.slice(1, 10)).toBe("P10038831");
      expect(res.slice(10, 14)).toBe("2026");
      expect(res.slice(14, 16)).toBe("11");
      expect(res.slice(16, 21)).toBe("00077");
    });

    it("invariance: across 1,000 randomized permutations, format KonsultaHciNumber always produces exactly 21 characters", () => {
      const prefixes: Array<"R" | "T" | "E" | "P" | "S" | "M" | "D"> = ["R", "T", "E", "P", "S", "M", "D"];
      const codeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789- _#.";

      for (let i = 0; i < 1000; i++) {
        const prefix = prefixes[i % prefixes.length];
        const len = Math.floor(Math.random() * 20);
        let code = "";
        for (let j = 0; j < len; j++) {
          code += codeChars[Math.floor(Math.random() * codeChars.length)];
        }
        const seq = Math.floor(Math.random() * 200000);
        const year = 2000 + (i % 50);
        const month = i % 12;
        const day = 1 + (i % 28);
        const date = new Date(year, month, day);

        const out = formatKonsultaHciNumber(prefix, code, seq, date);
        expect(out).toHaveLength(21);
        expect(out.charAt(0)).toBe(prefix);
      }
    });
  });
});
