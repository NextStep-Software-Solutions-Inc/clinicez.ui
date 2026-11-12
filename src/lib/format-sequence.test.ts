import {
  formatKonsultaHciNumber,
  formatTransactionNumber,
  formatAuthorizationCode,
  parseTimestampFromTransactionNumber,
} from './format-sequence';

describe('format-sequence (Issue #509 & Sequence Utilities)', () => {
  // Fixed reference date: November 12, 2026
  const fixedDate = new Date('2026-11-12T08:30:00Z');

  // =========================================================================
  // Tier 1: Feature Coverage (Isolation / Happy Path)
  // =========================================================================
  describe('Tier 1: Feature Coverage (Happy Path)', () => {
    it('preserves alphanumeric prefix "P" in facility accreditation code (#509)', () => {
      const result = formatKonsultaHciNumber('T', 'P10038831', 1, fixedDate);
      expect(result).toBe('TP1003883120261100001');
      expect(result.length).toBe(21);
      expect(result.slice(1, 10)).toBe('P10038831');
    });

    it('supports hospital accreditation code starting with "H"', () => {
      const result = formatKonsultaHciNumber('T', 'H91000000', 42, fixedDate);
      expect(result).toBe('TH9100000020261100042');
      expect(result.slice(1, 10)).toBe('H91000000');
    });

    it('supports standard 9-digit numeric accreditation code', () => {
      const result = formatKonsultaHciNumber('T', '010038831', 5, fixedDate);
      expect(result).toBe('T01003883120261100005');
      expect(result.slice(1, 10)).toBe('010038831');
    });

    it('supports all defined Konsulta prefix types', () => {
      const prefixes: Array<'R' | 'T' | 'E' | 'P' | 'S' | 'M' | 'D'> = [
        'R', // Registration
        'T', // Transaction
        'E', // Enlistment
        'P', // Profiling
        'S', // SOAP / Consultation
        'M', // Medicine
        'D', // Diagnostic
      ];

      for (const prefix of prefixes) {
        const res = formatKonsultaHciNumber(prefix, 'P10038831', 123, fixedDate);
        expect(res).toBe(`${prefix}P1003883120261100123`);
        expect(res.charAt(0)).toBe(prefix);
        expect(res.length).toBe(21);
      }
    });

    it('generates formatted transaction numbers with and without clinicId', () => {
      const withClinic = formatTransactionNumber(123, 456, fixedDate);
      expect(withClinic).toBe('EKAS-C123-20261112-000456');

      const withoutClinic = formatTransactionNumber(null, 789, fixedDate);
      expect(withoutClinic).toBe('EKAS-20261112-000789');
    });

    it('generates formatted authorization codes with and without clinicId', () => {
      const withClinic = formatAuthorizationCode(99, 12, fixedDate);
      expect(withClinic).toBe('PHK-C99-20261112-000012');

      const withoutClinic = formatAuthorizationCode(null, 34, fixedDate);
      expect(withoutClinic).toBe('PHK-20261112-000034');
    });

    it('parses timestamps from valid 3-part and 4-part transaction numbers', () => {
      const date1 = parseTimestampFromTransactionNumber('EKAS-20261112-000789');
      expect(date1).not.toBeNull();
      expect(date1?.getFullYear()).toBe(2026);
      expect(date1?.getMonth()).toBe(10); // 0-indexed November
      expect(date1?.getDate()).toBe(12);

      const date2 = parseTimestampFromTransactionNumber('EKAS-C123-20260520-000456');
      expect(date2).not.toBeNull();
      expect(date2?.getFullYear()).toBe(2026);
      expect(date2?.getMonth()).toBe(4); // 0-indexed May
      expect(date2?.getDate()).toBe(20);
    });
  });

  // =========================================================================
  // Tier 2: Boundary & Corner Cases
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('pads 8-digit numeric accreditation with leading zero to 9 characters', () => {
      const result = formatKonsultaHciNumber('T', '10038831', 1, fixedDate);
      expect(result).toBe('T01003883120261100001');
      expect(result.slice(1, 10)).toBe('010038831');
    });

    it('strips hyphens and whitespace from alphanumeric accreditation code while retaining letters', () => {
      const withHyphens = formatKonsultaHciNumber('T', 'P-1003-8831', 1, fixedDate);
      expect(withHyphens).toBe('TP1003883120261100001');

      const withSpaces = formatKonsultaHciNumber('T', ' P 1003 8831 ', 1, fixedDate);
      expect(withSpaces).toBe('TP1003883120261100001');

      const withMixedSymbols = formatKonsultaHciNumber('S', 'H_9100-0000#', 99, fixedDate);
      expect(withMixedSymbols).toBe('SH9100000020261100099');
    });

    it('pads short accreditation code with leading zeros up to 9 characters', () => {
      const result = formatKonsultaHciNumber('T', 'P123', 7, fixedDate);
      expect(result).toBe('T00000P12320261100007');
      expect(result.slice(1, 10)).toBe('00000P123');
    });

    it('slices overly long accreditation numbers to the last 9 characters', () => {
      const result = formatKonsultaHciNumber('T', 'PREFIXP10038831', 1, fixedDate);
      expect(result.slice(1, 10)).toBe('P10038831');
      expect(result.length).toBe(21);
    });

    it('handles empty or blank accreditation string gracefully', () => {
      const result = formatKonsultaHciNumber('T', '', 1, fixedDate);
      expect(result).toBe('T00000000020261100001');
      expect(result.length).toBe(21);
    });

    it('handles sequence number boundaries: 0, 1, 99999, and overflow slicing', () => {
      const seqZero = formatKonsultaHciNumber('T', 'P10038831', 0, fixedDate);
      expect(seqZero.slice(16, 21)).toBe('00000');

      const seqOne = formatKonsultaHciNumber('T', 'P10038831', 1, fixedDate);
      expect(seqOne.slice(16, 21)).toBe('00001');

      const seqMax = formatKonsultaHciNumber('T', 'P10038831', 99999, fixedDate);
      expect(seqMax.slice(16, 21)).toBe('99999');

      // Overflow wraps/slices last 5 digits
      const seqOverflow = formatKonsultaHciNumber('T', 'P10038831', 100000, fixedDate);
      expect(seqOverflow.slice(16, 21)).toBe('00000');

      const seqBig = formatKonsultaHciNumber('T', 'P10038831', 123456, fixedDate);
      expect(seqBig.slice(16, 21)).toBe('23456');
    });

    it('pads month properly across calendar year transitions', () => {
      const janDate = new Date('2026-01-05T00:00:00Z');
      const janResult = formatKonsultaHciNumber('T', 'P10038831', 1, janDate);
      expect(janResult.slice(10, 16)).toBe('202601');

      const octDate = new Date('2026-10-15T00:00:00Z');
      const octResult = formatKonsultaHciNumber('T', 'P10038831', 1, octDate);
      expect(octResult.slice(10, 16)).toBe('202610');

      const decDate = new Date('2026-12-31T00:00:00Z');
      const decResult = formatKonsultaHciNumber('T', 'P10038831', 1, decDate);
      expect(decResult.slice(10, 16)).toBe('202612');

      const leapDate = new Date('2024-02-29T12:00:00Z');
      const leapResult = formatKonsultaHciNumber('T', 'P10038831', 1, leapDate);
      expect(leapResult.slice(10, 16)).toBe('202402');
    });

    it('falls back to current system date when date argument is undefined', () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

      const result = formatKonsultaHciNumber('T', 'P10038831', 1);
      expect(result.length).toBe(21);
      expect(result.slice(10, 14)).toBe(String(currentYear));
      expect(result.slice(14, 16)).toBe(currentMonth);
    });

    it('enforces exact 21-character structure contract: 1 prefix + 9 accre + 4 year + 2 month + 5 seq', () => {
      const testInputs: Array<{ prefix: 'R' | 'T' | 'E' | 'P' | 'S' | 'M' | 'D'; accre: string; seq: number }> = [
        { prefix: 'P', accre: 'P10038831', seq: 1 },
        { prefix: 'S', accre: 'H91000000', seq: 9999 },
        { prefix: 'T', accre: '010038831', seq: 50 },
        { prefix: 'E', accre: '10038831', seq: 100 },
        { prefix: 'M', accre: 'P-999-8888', seq: 777 },
        { prefix: 'D', accre: 'A00000001', seq: 3 },
      ];

      for (const input of testInputs) {
        const out = formatKonsultaHciNumber(input.prefix, input.accre, input.seq, fixedDate);
        expect(out).toHaveLength(21);
        expect(out.charAt(0)).toBe(input.prefix);
        expect(out.slice(10, 14)).toBe('2026');
        expect(out.slice(14, 16)).toBe('11');
      }
    });

    it('parseTimestampFromTransactionNumber returns null for invalid transaction strings', () => {
      expect(parseTimestampFromTransactionNumber('')).toBeNull();
      expect(parseTimestampFromTransactionNumber('INVALID-FORMAT')).toBeNull();
      expect(parseTimestampFromTransactionNumber('EKAS-202611-000001')).toBeNull(); // date length != 8
      expect(parseTimestampFromTransactionNumber('EKAS-NOTADATE-000001')).toBeNull(); // NaN
      expect(parseTimestampFromTransactionNumber('EKAS-C1-2-3-4-5')).toBeNull(); // wrong parts count
    });
  });

  // =========================================================================
  // Tier 3: Cross-Feature Integration
  // =========================================================================
  describe('Tier 3: Cross-Feature Integration', () => {
    it('coordinates Profiling (P), Consultation SOAP (S), and Transaction (T) numbers for same patient encounter', () => {
      const accre = 'P10038831';
      const seq = 88;

      const profilingNo = formatKonsultaHciNumber('P', accre, seq, fixedDate);
      const soapNo = formatKonsultaHciNumber('S', accre, seq, fixedDate);
      const transNo = formatKonsultaHciNumber('T', accre, seq, fixedDate);

      expect(profilingNo).toBe('PP1003883120261100088');
      expect(soapNo).toBe('SP1003883120261100088');
      expect(transNo).toBe('TP1003883120261100088');

      // Common invariant across transaction suite
      expect(profilingNo.slice(1)).toBe(soapNo.slice(1));
      expect(soapNo.slice(1)).toBe(transNo.slice(1));
    });

    it('round-trip: formatTransactionNumber and parseTimestampFromTransactionNumber maintain date integrity', () => {
      const originalDate = new Date('2026-08-15T00:00:00Z');
      const formatted = formatTransactionNumber(42, 999, originalDate);

      const parsed = parseTimestampFromTransactionNumber(formatted);
      expect(parsed).not.toBeNull();
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(7); // August (0-indexed)
      expect(parsed?.getDate()).toBe(15);
    });

    it('preserves uppercase and lowercase letters in facility codes', () => {
      const upper = formatKonsultaHciNumber('T', 'P10038831', 1, fixedDate);
      const lower = formatKonsultaHciNumber('T', 'p10038831', 1, fixedDate);

      expect(upper).toBe('TP1003883120261100001');
      expect(lower).toBe('Tp1003883120261100001');
    });
  });

  // =========================================================================
  // Tier 4: Real-World Workflow Scenarios
  // =========================================================================
  describe('Tier 4: Real-World PhilHealth Konsulta Scenarios', () => {
    it('simulates PhilHealth Konsulta E-PresS claim transaction generation for accredited provider P10038831', () => {
      const providerAccre = 'P10038831';
      const consultationDate = new Date('2026-11-12T14:45:00Z');
      const prescriptionSequence = 104;

      const ePresSTransNo = formatKonsultaHciNumber('S', providerAccre, prescriptionSequence, consultationDate);
      const medicineTransNo = formatKonsultaHciNumber('M', providerAccre, prescriptionSequence, consultationDate);

      expect(ePresSTransNo).toBe('SP1003883120261100104');
      expect(medicineTransNo).toBe('MP1003883120261100104');
      expect(ePresSTransNo).toMatch(/^S[A-Z0-9]{9}\d{4}\d{2}\d{5}$/);
    });

    it('simulates month-end rollover batch generation (Nov 30 to Dec 1)', () => {
      const providerAccre = 'P10038831';
      const lastDayNov = new Date(2026, 10, 30, 12, 0, 0); // Month 10 is November
      const firstDayDec = new Date(2026, 11, 1, 12, 0, 0); // Month 11 is December

      const lastNovTx = formatKonsultaHciNumber('T', providerAccre, 9999, lastDayNov);
      const firstDecTx = formatKonsultaHciNumber('T', providerAccre, 1, firstDayDec);

      expect(lastNovTx).toBe('TP1003883120261109999');
      expect(firstDecTx).toBe('TP1003883120261200001');
    });

    it('validates against multiple official PhilHealth accreditation formats from real facilities', () => {
      const realFacilityCodes = [
        { name: 'Primary Care Facility A', code: 'P10038831', expectedPadded: 'P10038831' },
        { name: 'City Hospital Konsulta Clinic', code: 'H91000000', expectedPadded: 'H91000000' },
        { name: 'Standard 9-digit Rural Health Unit', code: '010038831', expectedPadded: '010038831' },
        { name: 'Legacy 8-digit Clinic (hyphenated)', code: '1003-8831', expectedPadded: '010038831' },
      ];

      for (const facility of realFacilityCodes) {
        const transNo = formatKonsultaHciNumber('T', facility.code, 1, fixedDate);
        expect(transNo).toHaveLength(21);
        expect(transNo.slice(1, 10)).toBe(facility.expectedPadded);
      }
    });
  });
});
