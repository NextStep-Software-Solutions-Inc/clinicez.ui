import { matchesSearch } from './search-utils'

describe('matchesSearch', () => {
  describe('Substring matching', () => {
    it('should match exact substring', () => {
      expect(matchesSearch('Acne', 'acne')).toBe(true)
      expect(matchesSearch('Diabetes', 'diabetes')).toBe(true)
    })

    it('should match partial substring', () => {
      expect(matchesSearch('Acne', 'cne')).toBe(true)
      expect(matchesSearch('Acne', 'ac')).toBe(true)
      expect(matchesSearch('Diabetes', 'diab')).toBe(true)
      expect(matchesSearch('Arthritis', 'thri')).toBe(true)
    })

    it('should be case insensitive for substrings', () => {
      expect(matchesSearch('Acne', 'ACNE')).toBe(true)
      expect(matchesSearch('DIABETES', 'diab')).toBe(true)
      expect(matchesSearch('High Blood Pressure', 'PRESSURE')).toBe(true)
    })
  })

  describe('Fuzzy matching (character presence)', () => {
    it('should match when all characters are present (original issue)', () => {
      // The main issue: "ance" should match "Acne"
      expect(matchesSearch('Acne', 'ance')).toBe(true)
    })

    it('should match abbreviations', () => {
      expect(matchesSearch('High Blood Pressure', 'hbp')).toBe(true)
      expect(matchesSearch('Diabetes', 'dts')).toBe(true)
      expect(matchesSearch('Asthma', 'asma')).toBe(true)
    })

    it('should match when characters are out of order', () => {
      expect(matchesSearch('Arthritis', 'artis')).toBe(true)
      expect(matchesSearch('Pneumonia', 'pnmn')).toBe(true)
    })

    it('should be case insensitive for fuzzy matching', () => {
      expect(matchesSearch('Acne', 'ANCE')).toBe(true)
      expect(matchesSearch('DIABETES', 'dts')).toBe(true)
    })

    it('should respect character frequency (not match duplicates)', () => {
      // "aaa" should not match "Acne" because Acne only has one "a"
      expect(matchesSearch('Acne', 'aaa')).toBe(false)
      
      // "ll" should match "Allergy" because it has two "l"s
      expect(matchesSearch('Allergy', 'll')).toBe(true)
      
      // "lll" should not match "Allergy" because it only has two "l"s
      expect(matchesSearch('Allergy', 'lll')).toBe(false)
    })
  })

  describe('Non-matches', () => {
    it('should not match when characters are missing', () => {
      expect(matchesSearch('Acne', 'xyz')).toBe(false)
      expect(matchesSearch('Diabetes', 'cancer')).toBe(false)
      expect(matchesSearch('Asthma', 'xyz')).toBe(false)
    })

    it('should not match when some characters are missing', () => {
      expect(matchesSearch('Acne', 'acnez')).toBe(false)
      expect(matchesSearch('Diabetes', 'diabetess')).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should match empty search string', () => {
      expect(matchesSearch('Acne', '')).toBe(true)
      expect(matchesSearch('Any condition', '')).toBe(true)
    })

    it('should handle single character searches', () => {
      expect(matchesSearch('Acne', 'a')).toBe(true)
      expect(matchesSearch('Acne', 'c')).toBe(true)
      expect(matchesSearch('Acne', 'z')).toBe(false)
    })

    it('should handle spaces in condition names', () => {
      expect(matchesSearch('High Blood Pressure', 'high blood')).toBe(true)
      expect(matchesSearch('High Blood Pressure', 'highblood')).toBe(true) // fuzzy match - space not required
      expect(matchesSearch('High Blood Pressure', 'highbloodz')).toBe(false) // 'z' not present
    })

    it('should handle special characters', () => {
      expect(matchesSearch("Crohn's Disease", "crohn's")).toBe(true)
      expect(matchesSearch("Crohn's Disease", "crohns")).toBe(true) // fuzzy match - all chars present
      expect(matchesSearch("Crohn's Disease", "cronz")).toBe(false) // 'z' not in name
    })

    it('should handle numbers', () => {
      expect(matchesSearch('Type 2 Diabetes', 'type 2')).toBe(true)
      expect(matchesSearch('Type 2 Diabetes', 't2d')).toBe(true)
    })
  })

  describe('Real-world medical conditions', () => {
    it('should match common medical condition searches', () => {
      // Common abbreviations
      expect(matchesSearch('Hypertension', 'htn')).toBe(true)
      expect(matchesSearch('Chronic Obstructive Pulmonary Disease', 'copd')).toBe(true)
      expect(matchesSearch('Gastroesophageal Reflux Disease', 'gerd')).toBe(true)
      
      // Partial spellings
      expect(matchesSearch('Pneumonia', 'pneu')).toBe(true)
      expect(matchesSearch('Bronchitis', 'bronc')).toBe(true)
      expect(matchesSearch('Osteoporosis', 'osteo')).toBe(true)
      
      // Fuzzy variations
      expect(matchesSearch('Migraine', 'migrane')).toBe(true) // fuzzy match - all chars present
      expect(matchesSearch('Migraine', 'migranz')).toBe(false) // 'z' not present
      expect(matchesSearch('Migraine', 'mgrn')).toBe(true) // abbreviation style
    })
  })
})
